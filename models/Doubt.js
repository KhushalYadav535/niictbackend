const mongoose = require('mongoose');

const doubtSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  desc: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  replies: { type: Number, default: 0 },
  hasFacultyReply: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doubt', doubtSchema);
