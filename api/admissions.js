const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Admission = require('../models/Admission');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection (use process.env.MONGODB_URI)
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  isConnected = true;
}

// Get all admissions
app.get('/api/admissions', async (req, res) => {
  await connectDB();
  try {
    const admissions = await Admission.find();
    res.json(admissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single admission
app.get('/api/admissions/:id', async (req, res) => {
  await connectDB();
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
app.post('/api/admissions', async (req, res) => {
  await connectDB();
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
app.patch('/api/admissions/:id', async (req, res) => {
  await connectDB();
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

module.exports = app;
module.exports.handler = (req, res) => app(req, res); 