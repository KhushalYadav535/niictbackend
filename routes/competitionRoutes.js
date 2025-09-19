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
    if (!name || !fatherName || !motherName || !phone || !school || !parentPhone || !address || !aadhaar || !dateOfBirth || !classPassed || !image) {
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
          examDate: '20 October 2024',
          examTime: '8:00 AM',
          reportingTime: '7:00 AM',
      examCenter: 'SK Modern Intermediate College, Semari, Jaunpur'
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


