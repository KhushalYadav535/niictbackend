const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    filename: { type: String, required: true },
    size: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Image', ImageSchema);


