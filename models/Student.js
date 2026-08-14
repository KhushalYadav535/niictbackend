const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  session: { type: String, required: true },
  courseType: { type: String },
  courseInterest: { type: String },
  fatherName: { type: String, required: true },
  motherName: { type: String },
  mobile: { type: String, required: true },
  alternateMobile: { type: String },
  email: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  qualification: { type: String },
  address: { type: String, required: true },
  profilePhoto: { type: String },
  marksheetCertificate: { type: String },
  aadharCard: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'paid'], 
    default: 'pending' 
  },
  franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
  studentId: { type: String, unique: true }
}, {
  timestamps: true
});

// Auto-increment student ID
studentSchema.pre('save', async function(next) {
  if (!this.studentId) {
    const Counter = require('./Counter');
    const counter = await Counter.findOneAndUpdate(
      { _id: 'studentId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.studentId = String(counter.seq).padStart(6, '0');
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
