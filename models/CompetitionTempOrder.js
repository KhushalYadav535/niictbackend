const mongoose = require('mongoose');

const CompetitionTempOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    paymentSessionId: { type: String },
    amount: { type: Number, default: 150 },
    formData: {
      name: { type: String, required: true },
      fatherName: { type: String, required: true },
      motherName: { type: String, required: true },
      phone: { type: String, required: true },
      school: { type: String, required: true },
      parentPhone: { type: String },
      address: { type: String, required: true },
      subject: { type: String, default: 'GK' },
      aadhaar: { type: String },
      dateOfBirth: { type: Date, required: true },
      classPassed: { type: String, required: true },
      image: { type: String },
      session: { type: String, default: '2026-2027' }
    },
    status: { type: String, enum: ['created', 'completed', 'failed'], default: 'created' },
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-cleans after 24 hours
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompetitionTempOrder', CompetitionTempOrderSchema);
