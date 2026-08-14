const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  q: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true } // Index of the correct option
});

const mockTestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  questions: [questionSchema],
  enrolledStudents: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MockTest', mockTestSchema);
