const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '30d' });
};

// In-memory store for OTPs (For prototype only)
const otpStore = new Map();

// Helper to generate OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// Request OTP for Registration
router.post('/register', async (req, res) => {
  const { phone } = req.body;
  try {
    const userExists = await User.findOne({ phone });
    if (userExists) return res.status(400).json({ message: 'Phone number already registered' });
    
    const otp = generateOTP();
    otpStore.set(phone, { otp, action: 'register', expiresAt: Date.now() + 5 * 60 * 1000 });
    
    console.log(`\n========================================`);
    console.log(`[TESTING] OTP for Registration`);
    console.log(`Phone: ${phone}`);
    console.log(`OTP: ${otp}`);
    console.log(`========================================\n`);

    res.json({ message: 'OTP sent to console for verification' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request OTP for Login
router.post('/login', async (req, res) => {
  const { phone } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(401).json({ message: 'Phone number not found. Please register.' });
    
    const otp = generateOTP();
    otpStore.set(phone, { otp, action: 'login', expiresAt: Date.now() + 5 * 60 * 1000 });
    
    console.log(`\n========================================`);
    console.log(`[TESTING] OTP for Login`);
    console.log(`Phone: ${phone}`);
    console.log(`OTP: ${otp}`);
    console.log(`========================================\n`);

    res.json({ message: 'OTP sent to console for verification' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { phone, otp, name } = req.body;
  try {
    const record = otpStore.get(phone);
    if (!record) return res.status(400).json({ message: 'No OTP requested or expired' });
    if (Date.now() > record.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ message: 'OTP has expired' });
    }
    if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    otpStore.delete(phone); // Clear OTP on success

    if (record.action === 'register') {
      const user = await User.create({ name, phone });
      return res.status(201).json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        xp: user.xp,
        avatar: user.avatar,
        token: generateToken(user._id)
      });
    } else if (record.action === 'login') {
      const user = await User.findOne({ phone });
      return res.json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        xp: user.xp,
        avatar: user.avatar,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
