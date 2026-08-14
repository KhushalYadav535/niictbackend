const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Franchise = require('../models/Franchise');
const mongoose = require('mongoose');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'franchise_secret_key', { expiresIn: '30d' });
};

router.get('/', async (req, res) => {
  try {
    const franchises = await Franchise.find().sort({ createdAt: -1 });
    res.json(franchises);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const franchise = await Franchise.findById(req.params.id);
    if (!franchise) return res.status(404).json({ message: 'Franchise not found' });
    res.json(franchise);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const franchise = new Franchise({
      instituteName: req.body.instituteName,
      ownerName: req.body.ownerName,
      dob: req.body.dob,
      pan: req.body.pan,
      gst: req.body.gst,
      contact1: req.body.contact1,
      contact2: req.body.contact2,
      whatsapp: req.body.whatsapp,
      email: req.body.email,
      ownerAddress: req.body.ownerAddress,
      instituteAddress: req.body.instituteAddress,
      pinCode: req.body.pinCode,
      district: req.body.district,
      state: req.body.state,
      password: req.body.password
    });

    const newFranchise = await franchise.save();
    res.status(201).json({
      _id: newFranchise._id,
      instituteName: newFranchise.instituteName,
      ownerName: newFranchise.ownerName,
      email: newFranchise.email,
      contact1: newFranchise.contact1,
      status: newFranchise.status
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(400).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const franchise = await Franchise.findOne({ email });

    if (!franchise) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (franchise.status !== 'approved') {
      return res.status(403).json({ message: 'Your application is not yet approved. Please contact admin.' });
    }

    const isMatch = await franchise.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: franchise._id,
      instituteName: franchise.instituteName,
      ownerName: franchise.ownerName,
      email: franchise.email,
      contact1: franchise.contact1,
      contact2: franchise.contact2,
      whatsapp: franchise.whatsapp,
      dob: franchise.dob,
      pan: franchise.pan,
      gst: franchise.gst,
      ownerAddress: franchise.ownerAddress,
      instituteAddress: franchise.instituteAddress,
      pinCode: franchise.pinCode,
      district: franchise.district,
      state: franchise.state,
      status: franchise.status,
      applicationDate: franchise.applicationDate,
      createdAt: franchise.createdAt,
      token: generateToken(franchise._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const franchise = await Franchise.findById(req.params.id);
    if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

    if (req.body.status) {
      franchise.status = req.body.status;
    }

    const updatedFranchise = await franchise.save();
    res.json(updatedFranchise);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid franchise ID format' });
    }

    const deletedFranchise = await Franchise.findByIdAndDelete(req.params.id);
    if (!deletedFranchise) return res.status(404).json({ message: 'Franchise not found' });

    res.json({ message: 'Franchise deleted successfully', deletedId: deletedFranchise._id });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting franchise' });
  }
});

module.exports = router;
