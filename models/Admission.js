const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  fathersName: {
    type: String,
    required: true
  },
  mothersName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  dateOfAdmission: {
    type: Date,
    default: Date.now
  },
  address: {
    type: String,
    required: true
  },
  education: {
    type: String,
    required: true
  },
  image: {
    type: String, // Store the image URL or base64
    required: true
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  }
});

module.exports = mongoose.model('Admission', admissionSchema);
