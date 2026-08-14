const express = require('express');
const router = express.Router();
// Assuming we'll add a Notification model later
// const Notification = require('../models/Notification');

router.get('/', async (req, res) => {
  try {
    // Return empty array to replace mock data for now
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
