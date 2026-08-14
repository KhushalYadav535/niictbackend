const express = require('express');
const router = express.Router();
const Flashcard = require('../models/Flashcard');

// Get all flashcards
router.get('/', async (req, res) => {
  try {
    const flashcards = await Flashcard.find().sort({ createdAt: -1 });
    res.json(flashcards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a flashcard
router.post('/', async (req, res) => {
  const flashcard = new Flashcard({
    front: req.body.front,
    back: req.body.back,
    category: req.body.category
  });

  try {
    const newFlashcard = await flashcard.save();
    res.status(201).json(newFlashcard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a flashcard
router.delete('/:id', async (req, res) => {
  try {
    const flashcard = await Flashcard.findByIdAndDelete(req.params.id);
    if (!flashcard) return res.status(404).json({ message: 'Flashcard not found' });
    res.json({ message: 'Flashcard deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
