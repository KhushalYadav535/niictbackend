const express = require('express');
const router = express.Router();
const Admission = require('../models/Admission');

// Get all admissions
router.get('/', async (req, res) => {
  try {
    const admissions = await Admission.find();
    res.json(admissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single admission
router.get('/:id', async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }
    res.json(admission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new admission
router.post('/', async (req, res) => {
  const admission = new Admission({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    course: req.body.course,
    dateOfBirth: req.body.dateOfBirth,
    address: req.body.address,
    education: req.body.education
  });

  try {
    const newAdmission = await admission.save();
    res.status(201).json(newAdmission);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update admission status
router.patch('/:id', async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }

    if (req.body.status) {
      admission.status = req.body.status;
    }

    const updatedAdmission = await admission.save();
    res.json(updatedAdmission);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
