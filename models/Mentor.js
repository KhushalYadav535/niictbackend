const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  nextAvailable: { type: String, required: true },
  image: { type: String }, // URL string
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mentor', mentorSchema);
