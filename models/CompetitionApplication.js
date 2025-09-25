const mongoose = require('mongoose');

const CompetitionApplicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },
    phone: { type: String, required: true },
    school: { type: String, required: true },
    parentPhone: { type: String, required: false },
    address: { type: String, required: true },
    subject: { type: String, default: 'GK' },
    aadhaar: { type: String, required: false },
    dateOfBirth: { type: Date, required: true },
    classPassed: { type: String, required: true },
    image: { type: String, required: true },
    rollNumber: { type: String, required: true, unique: true },
    paymentStatus: { type: String, enum: ['pending', 'verified'], default: 'pending' },
    // Exam details (store simple strings to match UI text directly)
    examDate: { type: String },
    examTime: { type: String },
    reportingTime: { type: String },
    examCenter: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompetitionApplication', CompetitionApplicationSchema);


