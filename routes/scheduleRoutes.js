const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');

// GET all schedules
router.get('/', async (req, res) => {
  try {
    const schedules = await Schedule.find().sort({ day: 1, startTime: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET schedule by day
router.get('/day/:day', async (req, res) => {
  try {
    const schedules = await Schedule.find({ day: req.params.day });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET today's live classes
router.get('/today', async (req, res) => {
  try {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const schedules = await Schedule.find({ day: today });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create schedule (admin)
router.post('/', async (req, res) => {
  try {
    const schedule = new Schedule(req.body);
    const saved = await schedule.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update schedule
router.put('/:id', async (req, res) => {
  try {
    const updated = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE schedule
router.delete('/:id', async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
