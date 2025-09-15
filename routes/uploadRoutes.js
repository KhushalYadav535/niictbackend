const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const router = express.Router();

// Configure Cloudinary (require env vars)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
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

// Signature endpoint for direct-to-Cloudinary uploads
router.post('/cloudinary-signature', (req, res) => {
  try {
    const { folder, public_id } = req.body || {};
    if (!folder || !public_id) {
      return res.status(400).json({ message: 'folder and public_id are required' });
    }

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;

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
    .update(stringToSign + process.env.CLOUDINARY_API_SECRET)
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
