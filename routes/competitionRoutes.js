const express = require('express');
const router = express.Router();
const CompetitionApplication = require('../models/CompetitionApplication');
const Counter = require('../models/Counter');

// POST /api/competition-applications
router.post('/', async (req, res) => {
  try {
    const {
      name,
      fatherName,
      motherName,
      phone,
      school,
      parentPhone,
      address,
      subject,
      aadhaar,
      dateOfBirth,
      classPassed,
      image
    } = req.body || {};

    // Basic validation aligned with frontend checks
    if (!name || !fatherName || !motherName || !phone || !school || !address || !dateOfBirth || !classPassed || !image) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate sequential roll number starting from 1001 (atomic)
    const counterId = 'competition_roll';
    // Ensure counter exists and is aligned with current max rollNumber
    let counter = await Counter.findById(counterId);
    if (!counter) {
      const maxAgg = await CompetitionApplication.aggregate([
        { $project: { rollNumInt: { $toInt: '$rollNumber' } } },
        { $sort: { rollNumInt: -1 } },
        { $limit: 1 }
      ]);
      const maxExisting = (maxAgg && maxAgg[0] && maxAgg[0].rollNumInt) ? maxAgg[0].rollNumInt : 1000;
      const baseSeq = Math.max(0, maxExisting - 1000);
      try {
        counter = await Counter.create({ _id: counterId, seq: baseSeq });
      } catch (_) {
        counter = await Counter.findById(counterId);
      }
    }

    // Attempt to persist with a short retry loop to avoid duplicate roll numbers
    let appDoc;
    let lastErr;
    for (let i = 0; i < 10; i++) {
      const updated = await Counter.findByIdAndUpdate(counterId, { $inc: { seq: 1 } }, { new: true });
      const rollNumber = String(1000 + (Number(updated.seq) || 0));
      try {
        appDoc = await CompetitionApplication.create({
          name,
          fatherName,
          motherName,
          phone,
          school,
          parentPhone,
          address,
          subject: subject || 'GK',
          aadhaar,
          dateOfBirth: new Date(dateOfBirth),
          classPassed,
          image,
          rollNumber,
      paymentStatus: 'pending',
          // Provide exam details to match UI expectations
          examDate: '12 October 2025',
          examTime: '10:00 AM',
          reportingTime: '8:00 AM',
          examCenter: 'S K Modern Intermediate College Semari Janghai Jaunpur'
        });
        lastErr = undefined;
        break;
      } catch (e) {
        lastErr = e;
        if (!(e && e.code === 11000)) {
          // Non-duplicate error -> fail immediately
          break;
        }
        // else loop continues to try next number
      }
    }
    if (!appDoc) {
      if (lastErr && lastErr.code === 11000) {
        return res.status(409).json({ message: 'Duplicate roll number, please retry', error: lastErr.message });
      }
      throw lastErr || new Error('Unknown error creating application');
    }

    return res.status(201).json(appDoc);
  } catch (err) {
    // Known errors
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate roll number, please retry', error: err.message });
    }
    if (err && (err.name === 'ValidationError' || err.name === 'CastError')) {
      return res.status(400).json({ message: 'Invalid data provided', error: err.message });
    }
    console.error('Competition application create error:', err);
    return res.status(500).json({ message: 'Failed to create application', error: err.message });
  }
});

// GET /api/competition-applications
router.get('/', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    const list = await CompetitionApplication.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applications', error: err.message });
  }
});

// DELETE /api/competition-applications/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await CompetitionApplication.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Application not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete application', error: err.message });
  }
});

// GET /api/competition-applications/aadhaar/:aadhaar
router.get('/aadhaar/:aadhaar', async (req, res) => {
  try {
    const { aadhaar } = req.params;
    const { dob } = req.query;
    
    // Build query object
    const query = { aadhaar };
    
    // If DOB is provided, add it to the query
    if (dob) {
      // Convert DOB string to Date object for comparison
      const dobDate = new Date(dob);
      query.dateOfBirth = {
        $gte: new Date(dobDate.getFullYear(), dobDate.getMonth(), dobDate.getDate()),
        $lt: new Date(dobDate.getFullYear(), dobDate.getMonth(), dobDate.getDate() + 1)
      };
    }
    
    const application = await CompetitionApplication.findOne(query);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(application);
  } catch (err) {
    console.error('Aadhaar lookup error:', err);
    res.status(500).json({ message: 'Failed to lookup application', error: err.message });
  }
});

// GET /api/competition-applications/mobile/:mobile
router.get('/mobile/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;
    const { dob } = req.query;
    
    if (!dob) {
      return res.status(400).json({ message: 'Date of birth is required for mobile search' });
    }
    
    // Build query object
    const query = { phone: mobile };
    
    // Convert DOB string to Date object for comparison
    const dobDate = new Date(dob);
    query.dateOfBirth = {
      $gte: new Date(dobDate.getFullYear(), dobDate.getMonth(), dobDate.getDate()),
      $lt: new Date(dobDate.getFullYear(), dobDate.getMonth(), dobDate.getDate() + 1)
    };
    
    const application = await CompetitionApplication.findOne(query);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(application);
  } catch (err) {
    console.error('Mobile lookup error:', err);
    res.status(500).json({ message: 'Failed to lookup application', error: err.message });
  }
});

// GET /api/competition-applications/name/:name
router.get('/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { dob } = req.query;
    
    if (!dob) {
      return res.status(400).json({ message: 'Date of birth is required for name search' });
    }
    
    // Build query object - case insensitive search
    const query = { 
      name: { $regex: decodeURIComponent(name), $options: 'i' }
    };
    
    // Convert DOB string to Date object for comparison
    const dobDate = new Date(dob);
    query.dateOfBirth = {
      $gte: new Date(dobDate.getFullYear(), dobDate.getMonth(), dobDate.getDate()),
      $lt: new Date(dobDate.getFullYear(), dobDate.getMonth(), dobDate.getDate() + 1)
    };
    
    const application = await CompetitionApplication.findOne(query);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(application);
  } catch (err) {
    console.error('Name lookup error:', err);
    res.status(500).json({ message: 'Failed to lookup application', error: err.message });
  }
});

// GET /api/competition-applications/name-phone
router.get('/name-phone', async (req, res) => {
  try {
    const { name, phone } = req.query;
    
    if (!name || !phone) {
      return res.status(400).json({ message: 'Both name and phone number are required' });
    }
    
    // Validate phone format
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number' });
    }
    
    // Build query object - case insensitive name search with exact phone match
    const query = { 
      name: { $regex: decodeURIComponent(name), $options: 'i' },
      phone: phone
    };
    
    const application = await CompetitionApplication.findOne(query);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(application);
  } catch (err) {
    console.error('Name-phone lookup error:', err);
    res.status(500).json({ message: 'Failed to lookup application', error: err.message });
  }
});

// PATCH /api/competition-applications/:id/payment
router.patch('/:id/payment', async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['pending', 'verified'].includes(status)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }
    const updated = await CompetitionApplication.findByIdAndUpdate(
      req.params.id,
      { $set: { paymentStatus: status } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Application not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update payment status', error: err.message });
  }
});

module.exports = router;


