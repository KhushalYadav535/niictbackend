const express = require('express');
const router = express.Router();
const CompetitionApplication = require('../models/CompetitionApplication');

// util to generate 4-digit roll
function generateRollNumber() {
  const timestamp = Date.now();
  return String(timestamp % 10000).padStart(4, '0');
}

// List all applications
router.get('/', async (req, res) => {
  try {
    const apps = await CompetitionApplication.find().sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create application
router.post('/', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const {
      name,
      phone,
      fatherName,
      motherName,
      aadhaar,
      dateOfBirth,
      school,
      classPassed,
      parentPhone,
      address,
      subject,
      image,
    } = req.body;

    // basic server-side validations
    if (!name || !fatherName || !motherName || !aadhaar || !dateOfBirth || !school || !classPassed || (!phone && !parentPhone) || !address || !image) {
      return res.status(400).json({ message: 'Please fill all required fields including student image' });
    }
    if (!/^\d{12}$/.test(String(aadhaar))) {
      return res.status(400).json({ message: 'Invalid Aadhaar number' });
    }
    
    // Calculate age from date of birth
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
    
    if (actualAge > 20) {
      return res.status(400).json({ message: 'Only candidates aged 20 or below can register' });
    }
    const allowed = ['8th','9th','10th','11th','12th','Diploma','Undergraduate','Graduation','Graduate','Bachelors'];
    if (!allowed.map(v => v.toLowerCase()).includes(String(classPassed).toLowerCase())) {
      return res.status(400).json({ message: 'Invalid classPassed value' });
    }

    const rollNumber = generateRollNumber();

    const doc = new CompetitionApplication({
      name,
      phone: phone || parentPhone,
      fatherName,
      motherName,
      aadhaar: String(aadhaar),
      dateOfBirth,
      age: actualAge,
      school,
      classPassed,
      parentPhone: parentPhone || phone,
      address,
      subject: subject || 'GK',
      image,
      rollNumber,
      examDate: '20 October 2024',
      examTime: '8:00 AM',
      reportingTime: '7:00 AM',
      examCenter: 'SK Modern Intermediate College, Semri, Jaunpur',
      applicationDate: new Date().toLocaleDateString('en-IN'),
      paymentStatus: 'pending',
    });

    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create application' });
  }
});

// Get single application
router.get('/:id', async (req, res) => {
  try {
    const app = await CompetitionApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lookup by roll number with optional DOB check
router.get('/roll/:rollNumber', async (req, res) => {
  try {
    const { rollNumber } = req.params;
    const { dob } = req.query; // expected as YYYY-MM-DD (same as dateOfBirth stored)
    const app = await CompetitionApplication.findOne({ rollNumber });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (dob && String(app.dateOfBirth) !== String(dob)) {
      return res.status(403).json({ message: 'DOB does not match' });
    }
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update payment status
router.patch('/:id/payment', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'verified'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const updated = await CompetitionApplication.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Application not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete application
router.delete('/:id', async (req, res) => {
  try {
    const app = await CompetitionApplication.findByIdAndDelete(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json({ message: 'Deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;


