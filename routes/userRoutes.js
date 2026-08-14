const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Get Leaderboard (Top 50 users by XP)
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({ role: 'student' })
      .sort({ xp: -1 })
      .limit(50)
      .select('name avatar xp');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Current User Profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('enrolledCourses').select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enroll in a course (Demo route)
router.post('/enroll', protect, async (req, res) => {
  try {
    const { courseId } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses.push(courseId);
      await user.save();
    }
    res.json({ message: 'Enrolled successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
