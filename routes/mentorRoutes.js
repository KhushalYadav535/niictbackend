const express = require('express');
const router = express.Router();
const Mentor = require('../models/Mentor');

// Get all mentors
router.get('/', async (req, res) => {
  try {
    const mentors = await Mentor.find().sort({ createdAt: -1 });
    res.json(mentors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a mentor
router.post('/', async (req, res) => {
  const mentor = new Mentor({
    name: req.body.name,
    role: req.body.role,
    nextAvailable: req.body.nextAvailable,
    image: req.body.image
  });

  try {
    const newMentor = await mentor.save();
    res.status(201).json(newMentor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a mentor
router.put('/:id', async (req, res) => {
  try {
    const updatedMentor = await Mentor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedMentor) return res.status(404).json({ message: 'Mentor not found' });
    res.json(updatedMentor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a mentor
router.delete('/:id', async (req, res) => {
  try {
    const mentor = await Mentor.findByIdAndDelete(req.params.id);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });
    res.json({ message: 'Mentor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
