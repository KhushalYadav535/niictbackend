const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { folder, public_id } = req.body || {};
    if (!folder || !public_id) {
      return res.status(400).json({ message: 'folder and public_id are required' });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({ message: 'Cloudinary environment not configured' });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&public_id=${public_id}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    return res.status(200).json({
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
};


