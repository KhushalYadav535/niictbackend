const express = require('express');
const router = express.Router();
const Admission = require('../models/Admission');
const mongoose = require('mongoose');
const { generateSimpleSerialRollNumber } = require('../utils/rollNumberGenerator');

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
  try {
    // Generate serial roll number
    const rollNumber = await generateSimpleSerialRollNumber();
    
    const admission = new Admission({
      name: req.body.name,
      fathersName: req.body.fathersName,
      mothersName: req.body.mothersName,
      email: req.body.email,
      phone: req.body.phone,
      course: req.body.course,
      dateOfBirth: req.body.dateOfBirth,
      dateOfAdmission: req.body.dateOfAdmission,
      address: req.body.address,
      education: req.body.education,
      image: req.body.image,
      rollNumber: rollNumber
    });

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

// Delete admission
router.delete('/:id', async (req, res) => {
  try {
    console.log('Attempting to delete admission with ID:', req.params.id);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid admission ID format');
      return res.status(400).json({ message: 'Invalid admission ID format' });
    }

    const deletedAdmission = await Admission.findByIdAndDelete(req.params.id);
    
    if (!deletedAdmission) {
      console.log('Admission not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Admission not found' });
    }

    console.log('Successfully deleted admission:', deletedAdmission._id);
    res.json({ 
      message: 'Admission deleted successfully',
      deletedId: deletedAdmission._id
    });
  } catch (err) {
    console.error('Error deleting admission:', err);
    res.status(500).json({ 
      message: 'Error deleting admission',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
