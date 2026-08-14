const express = require('express');
const router = express.Router();
const Paper = require('../models/Paper');

// Get all papers
router.get('/', async (req, res) => {
  try {
    const papers = await Paper.find().sort({ createdAt: -1 });
    res.json(papers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a paper
router.post('/', async (req, res) => {
  const paper = new Paper({
    title: req.body.title,
    type: req.body.type,
    fileUrl: req.body.fileUrl
  });

  try {
    const newPaper = await paper.save();
    res.status(201).json(newPaper);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a paper
router.delete('/:id', async (req, res) => {
  try {
    const paper = await Paper.findByIdAndDelete(req.params.id);
    if (!paper) return res.status(404).json({ message: 'Paper not found' });
    res.json({ message: 'Paper deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
