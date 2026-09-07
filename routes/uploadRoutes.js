const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const router = express.Router();
const Image = require('../models/Image');

// Helper for local disk saving
const saveLocally = async (file, prefix = 'media') => {
  const ext = path.extname(file.originalname || '.jpg') || '.jpg';
  const filename = `${prefix}_${Date.now()}${ext}`;
  const uploadsPath = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  const filePath = path.join(uploadsPath, filename);
  await fs.promises.writeFile(filePath, file.buffer);
  return filename;
};

// Resolve Cloudinary configuration from individual vars or CLOUDINARY_URL
const parseCloudinaryUrl = (url) => {
  try {
    const match = String(url || '').match(/^cloudinary:\/\/(.*?):(.*?)@(.*?)$/);
    if (!match) return {};
    const [, apiKey, apiSecret, cloudName] = match;
    return { apiKey, apiSecret, cloudName };
  } catch (_) {
    return {};
  }
};

const fromUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
const resolvedCloudName = process.env.CLOUDINARY_CLOUD_NAME || fromUrl.cloudName;
const resolvedApiKey = process.env.CLOUDINARY_API_KEY || fromUrl.apiKey;
const resolvedApiSecret = process.env.CLOUDINARY_API_SECRET || fromUrl.apiSecret;

// Configure Cloudinary if credentials exist
if (resolvedCloudName && resolvedApiKey && resolvedApiSecret) {
  cloudinary.config({
    cloud_name: resolvedCloudName,
    api_key: resolvedApiKey,
    api_secret: resolvedApiSecret
  });
}

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') || 
      file.mimetype.startsWith('video/') || 
      file.mimetype === 'application/pdf' || 
      file.mimetype.includes('pdf') ||
      file.mimetype.includes('document') ||
      file.mimetype.includes('word') ||
      file.mimetype.includes('octet-stream')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only image, video, and document files are allowed'), false);
    }
  }
});

// Local disk storage for fallback
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    const safeName = `student_${Date.now()}${ext}`;
    cb(null, safeName);
  }
});
const uploadLocal = multer({ storage: localStorage });

// Local upload endpoint
router.post('/upload-local', uploadLocal.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;
    return res.json({ success: true, secure_url: url, fileUrl: url, public_id: req.file.filename });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to upload locally', error: error.message });
  }
});

// Upload image to MongoDB (Buffer)
router.post('/upload-image-mongo', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const doc = await Image.create({
      data: req.file.buffer,
      contentType: req.file.mimetype,
      filename: req.file.originalname || `student_${Date.now()}`,
      size: req.file.size
    });

    // Return an id-based URL we can serve
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/api/images/${doc._id}`;
    return res.json({ success: true, secure_url: url, fileUrl: url, public_id: String(doc._id) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to upload to MongoDB', error: error.message });
  }
});

// Serve image by id
router.get('/images/:id', async (req, res) => {
  try {
    const img = await Image.findById(req.params.id);
    if (!img) return res.status(404).send('Not found');
    res.set('Content-Type', img.contentType);
    return res.send(img.data);
  } catch (error) {
    return res.status(500).send('Error');
  }
});

// Generate signature helper
const generateSignature = (params) => {
  const timestamp = Math.round((new Date()).getTime() / 1000);
  const paramsToSign = { ...params, timestamp };
  
  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .reduce((result, key) => {
      result[key] = paramsToSign[key];
      return result;
    }, {});
  
  const stringToSign = Object.keys(sortedParams)
    .map(key => `${key}=${sortedParams[key]}`)
    .join('&');
  
  const signature = crypto
    .createHash('sha1')
    .update(stringToSign + (resolvedApiSecret || process.env.CLOUDINARY_API_SECRET || ''))
    .digest('hex');
  
  return { signature, timestamp };
};

// Signature endpoint for direct-to-Cloudinary uploads
router.post('/cloudinary-signature', (req, res) => {
  try {
    const { folder, public_id } = req.body || {};
    if (!folder || !public_id) {
      return res.status(400).json({ message: 'folder and public_id are required' });
    }

    const apiSecret = resolvedApiSecret;
    const cloudName = resolvedCloudName;
    const apiKey = resolvedApiKey;

    if (!apiSecret || !cloudName || !apiKey) {
      return res.status(500).json({ message: 'Cloudinary environment not configured' });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&public_id=${public_id}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    return res.json({
      cloud_name: cloudName,
      api_key: apiKey,
      timestamp,
      signature,
      folder,
      public_id
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate signature', error: error.message });
  }
});

// Upload image route (competition & general)
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Try Cloudinary if cloud_name is configured
    if (resolvedCloudName && resolvedApiKey && resolvedApiSecret) {
      try {
        const publicId = `student_${Date.now()}`;
        const folder = 'niict/competition';
        const { signature, timestamp } = generateSignature({
          folder: folder,
          public_id: publicId
        });

        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: folder,
              public_id: publicId,
              signature: signature,
              timestamp: timestamp,
              api_key: resolvedApiKey
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });

        return res.json({
          success: true,
          secure_url: result.secure_url,
          fileUrl: result.secure_url,
          public_id: result.public_id
        });
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed, using local storage fallback:', cloudErr.message);
      }
    }

    // Fallback: save to server local uploads directory
    const filename = await saveLocally(req.file, 'student');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${filename}`;

    return res.json({
      success: true,
      secure_url: fileUrl,
      fileUrl: fileUrl,
      public_id: filename
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload image',
      error: error.message 
    });
  }
});

// Upload media (image, video, pdf, documents) route
router.post('/upload-media', upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No media file provided' });
    }

    // Try Cloudinary if cloud_name is configured
    if (resolvedCloudName && resolvedApiKey && resolvedApiSecret) {
      try {
        const publicId = `media_${Date.now()}`;
        const folder = 'niict/courses';
        const { signature, timestamp } = generateSignature({
          folder: folder,
          public_id: publicId
        });

        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: folder,
              public_id: publicId,
              signature: signature,
              timestamp: timestamp,
              resource_type: "auto",
              api_key: resolvedApiKey
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });

        return res.json({
          success: true,
          secure_url: result.secure_url,
          fileUrl: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type
        });
      } catch (cloudErr) {
        console.warn('Cloudinary media upload failed, using local storage fallback:', cloudErr.message);
      }
    }

    // Fallback: save to server local uploads directory
    const filename = await saveLocally(req.file, 'media');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${filename}`;

    return res.json({
      success: true,
      secure_url: fileUrl,
      fileUrl: fileUrl,
      public_id: filename
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload media',
      error: error.message 
    });
  }
});

module.exports = router;
