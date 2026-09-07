const express = require('express');
const router = express.Router();
const InterviewQuestion = require('../models/InterviewQuestion');

// Get all interview questions
router.get('/', async (req, res) => {
  try {
    const questions = await InterviewQuestion.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a question
router.post('/', async (req, res) => {
  const question = new InterviewQuestion({
    category: req.body.category,
    q: req.body.q,
    a: req.body.a
  });

  try {
    const newQuestion = await question.save();
    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a question
router.put('/:id', async (req, res) => {
  try {
    const updatedQuestion = await InterviewQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedQuestion) return res.status(404).json({ message: 'Question not found' });
    res.json(updatedQuestion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a question
router.delete('/:id', async (req, res) => {
  try {
    const question = await InterviewQuestion.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
