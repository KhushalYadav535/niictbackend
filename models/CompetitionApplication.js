const mongoose = require('mongoose');

const CompetitionApplicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    motherName: { type: String, required: true, trim: true },
    aadhaar: { type: String, required: true, match: /^\d{12}$/ },
    dateOfBirth: { type: String, required: true },
    age: { type: Number, required: true, min: 1, max: 20 },
    school: { type: String, required: true, trim: true },
    classPassed: {
      type: String,
      required: true,
      enum: ['8th','9th','10th','11th','12th','Diploma','Undergraduate','Graduation','Graduate','Bachelors'],
    },
    parentPhone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    subject: { type: String, default: 'GK' },
    image: { type: String, required: true },

    // server-generated fields
    rollNumber: { type: String, required: true, unique: true, index: true },
    examDate: { type: String, required: true },
    examTime: { type: String, required: true },
    reportingTime: { type: String, required: true },
    examCenter: { type: String, required: true },
    applicationDate: { type: String, required: true },
    paymentStatus: { type: String, enum: ['pending', 'verified'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompetitionApplication', CompetitionApplicationSchema);


