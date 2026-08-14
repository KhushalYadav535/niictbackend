const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const franchiseSchema = new mongoose.Schema({
  instituteName: { type: String, required: true },
  ownerName: { type: String, required: true },
  dob: { type: Date },
  pan: { type: String },
  gst: { type: String },
  contact1: { type: String, required: true },
  contact2: { type: String },
  whatsapp: { type: String },
  email: { type: String, required: true, unique: true },
  ownerAddress: { type: String },
  instituteAddress: { type: String, required: true },
  pinCode: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  password: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  applicationDate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

franchiseSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

franchiseSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Franchise', franchiseSchema);
