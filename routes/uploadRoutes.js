const express = require('express');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const router = express.Router();
const Image = require('../models/Image');

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

// Configure Cloudinary
cloudinary.config({
  cloud_name: resolvedCloudName,
  api_key: resolvedApiKey,
  api_secret: resolvedApiSecret
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Local disk storage for fallback
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsPath = path.join(__dirname, '..', 'uploads');
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
    return res.json({ success: true, secure_url: url, public_id: req.file.filename });
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
    return res.json({ success: true, secure_url: url, public_id: String(doc._id) });
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

// Generate signature for Cloudinary upload
const generateSignature = (params) => {
  const timestamp = Math.round((new Date()).getTime() / 1000);
  const paramsToSign = { ...params, timestamp };
  
  // Sort parameters
  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .reduce((result, key) => {
      result[key] = paramsToSign[key];
      return result;
    }, {});
  
  // Create string to sign
  const stringToSign = Object.keys(sortedParams)
    .map(key => `${key}=${sortedParams[key]}`)
    .join('&');
  
  console.log('String to sign:', stringToSign);
  
  // Generate signature
  const signature = crypto
    .createHash('sha1')
    .update(stringToSign + (resolvedApiSecret || process.env.CLOUDINARY_API_SECRET || ''))
    .digest('hex');
  
  console.log('Generated signature:', signature);
  
  return { signature, timestamp };
};

// Upload image route
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Generate signature with the parameters we'll use
    const publicId = `student_${Date.now()}`;
    const folder = 'niict/competition';
    const { signature, timestamp } = generateSignature({
      folder: folder,
      public_id: publicId
    });

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: publicId,
          signature: signature,
          timestamp: timestamp,
          api_key: process.env.CLOUDINARY_API_KEY || '474711561275295'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload image',
      error: error.message 
    });
  }
});

module.exports = router;
