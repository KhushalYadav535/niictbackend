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
    image: { type: String, required: false },
    rollNumber: { type: String, required: true, unique: true },
    // Session identifier — e.g. "2025-2026", "2026-2027"
    session: { type: String, default: '2025-2026' },
    // Payment tracking
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'verified'], default: 'pending' },
    paymentOrderId: { type: String },          // Cashfree order_id
    paymentSessionId: { type: String },        // Cashfree payment_session_id
    paymentTransactionId: { type: String },    // Cashfree transaction reference
    paymentAmount: { type: Number, default: 150 },
    paidAt: { type: Date },
    // Exam details
    examDate: { type: String },
    examTime: { type: String },
    reportingTime: { type: String },
    examCenter: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompetitionApplication', CompetitionApplicationSchema);
