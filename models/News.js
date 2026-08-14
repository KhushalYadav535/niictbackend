const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String }, // URL string
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('News', newsSchema);
