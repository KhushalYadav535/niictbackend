const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema({
  category: { type: String, required: true },
  q: { type: String, required: true },
  a: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InterviewQuestion', interviewQuestionSchema);
