const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  students: {
    type: Number,
    default: 0
  },
  startDate: {
    type: String,
    default: 'Monthly'
  },
  image: {
    type: String, // URL of the thumbnail
    required: true
  },
  video: {
    type: String // URL of the video (optional)
  },
  rating: {
    type: Number,
    default: 0
  },
  price: {
    type: String,
    required: true
  },
  originalPrice: {
    type: String
  },
  discount: {
    type: String
  },
  features: [{
    type: String
  }],
  syllabus: [{
    title: String,
    description: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Course', courseSchema);
