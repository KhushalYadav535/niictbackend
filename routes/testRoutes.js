const express = require('express');
const router = express.Router();
const MockTest = require('../models/MockTest');

// Get all mock tests
router.get('/', async (req, res) => {
  try {
    // Return all tests without the answers to display in the list
    const tests = await MockTest.find({}, '-questions.correctAnswer').sort({ createdAt: -1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single test with questions (when user starts test)
router.get('/:id', async (req, res) => {
  try {
    const test = await MockTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });
    res.json(test);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new mock test (Admin)
router.post('/', async (req, res) => {
  try {
    const test = new MockTest(req.body);
    const createdTest = await test.save();
    res.status(201).json(createdTest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
