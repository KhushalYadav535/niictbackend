const express = require('express');
const router = express.Router();
const Doubt = require('../models/Doubt');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
      req.user = decoded; // { id: '...' }
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Get all doubts (publicly readable or protected depending on app rules, we'll make it public for now but populated with user)
router.get('/', async (req, res) => {
  try {
    const doubts = await Doubt.find().populate('user', 'name avatar').sort({ createdAt: -1 });
    res.json(doubts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new doubt
router.post('/', protect, async (req, res) => {
  const { category, title, desc } = req.body;
  try {
    const doubt = new Doubt({
      user: req.user.id,
      category,
      title,
      desc
    });
    const createdDoubt = await doubt.save();
    // Populate user info before returning
    await createdDoubt.populate('user', 'name avatar');
    res.status(201).json(createdDoubt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Faculty / Admin reply to a doubt
router.post('/:id/reply', async (req, res) => {
  const { reply, facultyName } = req.body;
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    doubt.facultyReply = reply;
    doubt.facultyName = facultyName || 'NIICT Senior Faculty';
    doubt.hasFacultyReply = true;
    doubt.repliedAt = new Date();
    doubt.status = 'Resolved';
    doubt.replies = (doubt.replies || 0) + 1;

    const updated = await doubt.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update doubt status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const doubt = await Doubt.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });
    res.json(doubt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a doubt (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Doubt.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Doubt not found' });
    res.json({ message: 'Doubt deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
