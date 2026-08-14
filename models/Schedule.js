const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  instructor: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  startTime: {
    type: String, // e.g. "10:00 AM"
    required: true
  },
  endTime: {
    type: String, // e.g. "11:30 AM"
    required: true
  },
  meetLink: {
    type: String,
    default: ''
  },
  isLive: {
    type: Boolean,
    default: false
  },
  thumbnail: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Schedule', scheduleSchema);
