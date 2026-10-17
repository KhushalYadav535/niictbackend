const express = require('express');
const router = express.Router();
const CompetitionApplication = require('../models/CompetitionApplication');
const Counter = require('../models/Counter');

const CURRENT_SESSION = '2026-2027'; // Update each year to match frontend

// Normalizes DOB string (e.g. "2006-06-01") to UTC midday (12:00:00Z) so timezone offset never flips day or month
const parseDobToDate = (dob) => {
  if (!dob) return null;
  if (typeof dob === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dob)) {
    const [y, m, d] = dob.slice(0, 10).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  }
  const dt = new Date(dob);
  if (isNaN(dt.getTime())) return null;
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 12, 0, 0));
};

// Generates a robust range for DOB query that accommodates legacy UTC midnight, local IST offset, and midday
const getDobQueryRange = (dob) => {
  if (!dob) return null;
  if (typeof dob === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dob)) {
    const [y, m, d] = dob.slice(0, 10).split('-').map(Number);
    return {
      $gte: new Date(Date.UTC(y, m - 1, d - 1, 12, 0, 0)),
      $lte: new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0))
    };
  }
  const dt = new Date(dob);
  return {
    $gte: new Date(dt.getTime() - 24 * 60 * 60 * 1000),
    $lte: new Date(dt.getTime() + 24 * 60 * 60 * 1000)
  };
};

// Generate sequential roll number starting from 1001 with NIICT prefix (e.g. NIICT1001, NIICT1234)
const generateNextRollNumber = async () => {
  const counterId = 'competition_roll';
  let counter = await Counter.findById(counterId);
  if (!counter) {
    const maxAgg = await CompetitionApplication.aggregate([
      {
        $project: {
          cleanRoll: {
            $replaceAll: { input: '$rollNumber', find: 'NIICT', replacement: '' }
          }
        }
      },
      {
        $project: {
          rollNumInt: {
            $convert: { input: '$cleanRoll', to: 'int', onError: 0, onNull: 0 }
          }
        }
      },
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

  for (let i = 0; i < 15; i++) {
    const updated = await Counter.findByIdAndUpdate(counterId, { $inc: { seq: 1 } }, { new: true });
    const seqNum = 1000 + (Number(updated.seq) || 0);
    const candidateRoll = `NIICT${seqNum}`;
    const exists = await CompetitionApplication.findOne({ rollNumber: candidateRoll });
    if (!exists) {
      return candidateRoll;
    }
  }
  throw new Error('Unable to allocate unique roll number after retries');
};

// Checks if a candidate is older than 20 years (>20 years + 1 day)
// Cutoff reference: 5 September 2026 or application date
const isCandidateOverAge = (dob, applicationDate) => {
  if (!dob) return false;
  let by, bm, bd;
  if (typeof dob === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dob)) {
    [by, bm, bd] = dob.slice(0, 10).split('-').map(Number);
  } else {
    const dt = new Date(dob);
    if (isNaN(dt.getTime())) return false;
    by = dt.getUTCFullYear();
    bm = dt.getUTCMonth() + 1;
    bd = dt.getUTCDate();
  }
  const twentiethBirthday = new Date(Date.UTC(by + 20, bm - 1, bd, 0, 0, 0));
  const cutoffDate = new Date(Date.UTC(2026, 8, 5, 0, 0, 0)); // 5 Sept 2026

  if (twentiethBirthday < cutoffDate) return true;

  if (applicationDate) {
    const appDate = new Date(applicationDate);
    if (!isNaN(appDate.getTime())) {
      const appDateUtc = new Date(Date.UTC(appDate.getUTCFullYear(), appDate.getUTCMonth(), appDate.getUTCDate(), 0, 0, 0));
      if (twentiethBirthday < appDateUtc) return true;
    }
  }

  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
  if (twentiethBirthday < todayUtc) return true;

  return false;
};

const formatAppResponse = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.isOverAge = isCandidateOverAge(obj.dateOfBirth, obj.createdAt);
  if (obj.isOverAge) {
    obj.ageNotice = 'Contact to NIICT Computer Institute Office - NIICT Computer Institute Janghai';
  }
  return obj;
};

// POST /api/competition-applications/offline
// Dedicated Admin-Only endpoint for Offline Candidate Registration
// Automatically marks as Paid, offline, and sets paymentAmount: 0 so it DOES NOT add to online wallet balance
router.post('/offline', async (req, res) => {
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
      image,
      session
    } = req.body || {};

    if (!name || !fatherName || !motherName || !phone || !school || !address || !dateOfBirth || !classPassed) {
      return res.status(400).json({ message: 'Missing required candidate fields' });
    }

    const rollNumber = await generateNextRollNumber();
    const appDoc = await CompetitionApplication.create({
      name: name.trim(),
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      phone: phone.trim(),
      school: school.trim(),
      parentPhone: parentPhone ? parentPhone.trim() : '',
      address: address.trim(),
      subject: subject || 'GK',
      aadhaar: aadhaar ? aadhaar.trim() : '',
      dateOfBirth: parseDobToDate(dateOfBirth) || new Date(dateOfBirth),
      classPassed: classPassed.trim(),
      image: image || null,
      rollNumber,
      session: session || CURRENT_SESSION,
      paymentStatus: 'paid',
      registrationType: 'offline',
      paymentMode: 'offline_cash',
      paymentAmount: 0, // Zero Rs added to online collection/wallet balance
      paymentTransactionId: `OFFLINE_CASH_${Date.now()}`,
      paidAt: new Date(),
      examDate: '18 October 2026',
      examTime: '10:00 AM – 11:30 AM (90 Min)',
      reportingTime: '8:00 AM',
      examCenter: 'S K Modern Intermediate College Semari Janghai Jaunpur'
    });

    return res.status(201).json(appDoc);
  } catch (err) {
    console.error('Offline competition registration error:', err);
    return res.status(500).json({ message: 'Failed to create offline application', error: err.message });
  }
});

// POST /api/competition-applications (Legacy/General endpoint)
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
      image,
      session
    } = req.body || {};

    // Basic validation aligned with frontend checks
    if (!name || !fatherName || !motherName || !phone || !school || !address || !dateOfBirth || !classPassed) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const rollNumber = await generateNextRollNumber();
    const appDoc = await CompetitionApplication.create({
      name: name.trim(),
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      phone: phone.trim(),
      school: school.trim(),
      parentPhone: parentPhone ? parentPhone.trim() : '',
      address: address.trim(),
      subject: subject || 'GK',
      aadhaar: aadhaar ? aadhaar.trim() : '',
      dateOfBirth: parseDobToDate(dateOfBirth) || new Date(dateOfBirth),
      classPassed: classPassed.trim(),
      image: image || null,
      rollNumber,
      session: session || CURRENT_SESSION,
      paymentStatus: 'pending',
      registrationType: 'online',
      paymentMode: 'online',
      examDate: '18 October 2026',
      examTime: '10:00 AM – 11:30 AM (90 Min)',
      reportingTime: '8:00 AM',
      examCenter: 'S K Modern Intermediate College Semari Janghai Jaunpur'
    });

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
    const { session } = req.query;
    const filter = session ? { session } : {};
    const list = await CompetitionApplication.find(filter).sort({ createdAt: -1 });
    res.json(list.map(formatAppResponse));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applications', error: err.message });
  }
});

// GET /api/competition-applications/sessions — list all distinct sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await CompetitionApplication.distinct('session');
    res.json(sessions.filter(Boolean).sort().reverse()); // newest first
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sessions', error: err.message });
  }
});

// POST /api/competition-applications/bulk-delete
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No application IDs provided for deletion' });
    }

    const result = await CompetitionApplication.deleteMany({ _id: { $in: ids } });
    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} application(s)`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Bulk delete competition applications error:', err);
    res.status(500).json({ message: 'Failed to delete applications', error: err.message });
  }
});

// POST /api/competition-applications/bulk-mark-paid
// Marks multiple applications as offline paid (zero wallet addition)
router.post('/bulk-mark-paid', async (req, res) => {
  try {
    const { ids, status = 'verified' } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No application IDs provided' });
    }

    const now = new Date();
    const result = await CompetitionApplication.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          paymentStatus: status,
          registrationType: 'offline',
          paymentMode: 'offline_cash',
          paymentAmount: 0, // Zero Rs added to online collection/wallet balance
          paidAt: now
        }
      }
    );

    res.json({
      success: true,
      message: `Successfully marked ${result.modifiedCount} application(s) as offline paid`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Bulk mark paid error:', err);
    res.status(500).json({ message: 'Failed to update applications', error: err.message });
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

// GET /api/competition-applications/roll/:rollNumber
router.get('/roll/:rollNumber', async (req, res) => {
  try {
    const rawRoll = (req.params.rollNumber || '').trim();
    if (!rawRoll) {
      return res.status(400).json({ message: 'Roll number is required' });
    }
    const cleanNum = rawRoll.replace(/^[A-Za-z]+/, '');
    const variants = [
      rawRoll,
      rawRoll.toUpperCase(),
      `NIICT${cleanNum}`,
      cleanNum
    ].filter(Boolean);

    const application = await CompetitionApplication.findOne({
      rollNumber: { $in: variants }
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found with this roll number' });
    }
    res.json(formatAppResponse(application));
  } catch (err) {
    console.error('Roll lookup error:', err);
    res.status(500).json({ message: 'Failed to lookup application', error: err.message });
  }
});

// GET /api/competition-applications/aadhaar/:aadhaar
router.get('/aadhaar/:aadhaar', async (req, res) => {
  try {
    const { aadhaar } = req.params;
    const { dob, session } = req.query;

    const query = { aadhaar };
    // Session filter: default to current session, pass session=ALL to search all
    if (session !== 'ALL') query.session = session || CURRENT_SESSION;

    if (dob) {
      query.dateOfBirth = getDobQueryRange(dob);
    }

    const application = await CompetitionApplication.findOne(query);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json(formatAppResponse(application));
  } catch (err) {
    console.error('Aadhaar lookup error:', err);
    res.status(500).json({ message: 'Failed to lookup application', error: err.message });
  }
});

// GET /api/competition-applications/mobile/:mobile
router.get('/mobile/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;
    const { dob, session } = req.query;

    if (!dob) return res.status(400).json({ message: 'Date of birth is required for mobile search' });

    const normalizedMobile = mobile.startsWith('0') ? mobile.substring(1) : mobile;
    const dobRange = getDobQueryRange(dob);

    const sessionFilter = session !== 'ALL' ? { session: session || CURRENT_SESSION } : {};
    const query = {
      ...sessionFilter,
      $and: [
        { dateOfBirth: dobRange },
        { $or: [{ phone: mobile }, { phone: normalizedMobile }, { phone: '0' + normalizedMobile }] }
      ]
    };

    const application = await CompetitionApplication.findOne(query);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json(formatAppResponse(application));
  } catch (err) {
    console.error('Mobile lookup error:', err);
    res.status(500).json({ message: 'Failed to lookup application', error: err.message });
  }
});

// GET /api/competition-applications/name/:name
router.get('/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { dob, session } = req.query;

    if (!dob) return res.status(400).json({ message: 'Date of birth is required for name search' });

    const query = {
      name: { $regex: decodeURIComponent(name), $options: 'i' },
      dateOfBirth: getDobQueryRange(dob)
    };
    if (session !== 'ALL') query.session = session || CURRENT_SESSION;

    const application = await CompetitionApplication.findOne(query);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json(formatAppResponse(application));
  } catch (err) {
    console.error('Name lookup error:', err);
    res.status(500).json({ message: 'Failed to lookup application', error: err.message });
  }
});

// GET /api/competition-applications/name-phone
router.get('/name-phone', async (req, res) => {
  try {
    const { name, phone, session } = req.query;

    if (!name || !phone) return res.status(400).json({ message: 'Both name and phone number are required' });
    if (!/^\d{10,11}$/.test(phone)) return res.status(400).json({ message: 'Please enter a valid 10 or 11-digit phone number' });

    const normalizedPhone = phone.startsWith('0') ? phone.substring(1) : phone;
    const query = {
      name: { $regex: decodeURIComponent(name), $options: 'i' },
      $or: [{ phone }, { phone: normalizedPhone }, { phone: '0' + normalizedPhone }]
    };
    if (session !== 'ALL') query.session = session || CURRENT_SESSION;

    const application = await CompetitionApplication.findOne(query);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json(formatAppResponse(application));
  } catch (err) {
    console.error('Name-phone lookup error:', err);
    res.status(500).json({ message: 'Failed to lookup application', error: err.message });
  }
});

// PATCH /api/competition-applications/:id/payment
router.patch('/:id/payment', async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['pending', 'verified', 'paid', 'failed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const app = await CompetitionApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const updateFields = { paymentStatus: status };

    if (status === 'verified' || status === 'paid') {
      // If manually verified/paid by admin and not an existing Cashfree online payment
      const isOnlineCashfree = Boolean(
        app.paymentOrderId && 
        app.paymentTransactionId && 
        !app.paymentTransactionId.startsWith('MANUAL_') && 
        !app.paymentTransactionId.startsWith('OFFLINE_')
      );

      if (!isOnlineCashfree) {
        // Mark as manual/offline verification so it DOES NOT add to online wallet balance
        updateFields.registrationType = 'offline';
        updateFields.paymentMode = 'offline_cash';
        updateFields.paymentAmount = 0; // Zero Rs added to online collection/wallet balance
        if (!app.paymentTransactionId) {
          updateFields.paymentTransactionId = `MANUAL_ADMIN_${Date.now()}`;
        }
      }
      if (!app.paidAt) {
        updateFields.paidAt = new Date();
      }
    } else if (status === 'pending') {
      updateFields.paidAt = null;
      updateFields.paymentAmount = 0;
    }

    const updated = await CompetitionApplication.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update payment status', error: err.message });
  }
});

// PUT & PATCH /api/competition-applications/:id
// Update competition application details (Admin edit to fix mistakes)
const updateCompetitionApplicationHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await CompetitionApplication.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Competition application not found' });
    }

    const {
      name,
      fatherName,
      motherName,
      phone,
      parentPhone,
      school,
      address,
      subject,
      aadhaar,
      dateOfBirth,
      classPassed,
      image,
      session,
      rollNumber,
      paymentStatus,
      registrationType,
      paymentMode,
      paymentAmount,
      examDate,
      examTime,
      reportingTime,
      examCenter
    } = req.body || {};

    const updateFields = {};
    if (name !== undefined) updateFields.name = String(name).trim();
    if (fatherName !== undefined) updateFields.fatherName = String(fatherName).trim();
    if (motherName !== undefined) updateFields.motherName = String(motherName).trim();
    if (phone !== undefined) updateFields.phone = String(phone).trim();
    if (parentPhone !== undefined) updateFields.parentPhone = String(parentPhone || '').trim();
    if (school !== undefined) updateFields.school = String(school).trim();
    if (address !== undefined) updateFields.address = String(address).trim();
    if (subject !== undefined) updateFields.subject = String(subject || 'GK').trim();
    if (aadhaar !== undefined) updateFields.aadhaar = String(aadhaar || '').trim();
    if (classPassed !== undefined) updateFields.classPassed = String(classPassed).trim();
    if (session !== undefined) updateFields.session = String(session).trim();
    if (image !== undefined) updateFields.image = image || null;

    if (dateOfBirth) {
      updateFields.dateOfBirth = parseDobToDate(dateOfBirth) || new Date(dateOfBirth);
    }

    if (paymentStatus !== undefined && ['pending', 'paid', 'verified', 'failed'].includes(paymentStatus)) {
      updateFields.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid' || paymentStatus === 'verified') {
        if (!existing.paidAt) {
          updateFields.paidAt = new Date();
        }
      } else if (paymentStatus === 'pending') {
        updateFields.paidAt = null;
      }
    }
    if (registrationType !== undefined) updateFields.registrationType = registrationType;
    if (paymentMode !== undefined) updateFields.paymentMode = paymentMode;
    if (paymentAmount !== undefined && paymentAmount !== null && paymentAmount !== '') {
      updateFields.paymentAmount = Number(paymentAmount) || 0;
    }
    if (examDate !== undefined) updateFields.examDate = examDate;
    if (examTime !== undefined) updateFields.examTime = examTime;
    if (reportingTime !== undefined) updateFields.reportingTime = reportingTime;
    if (examCenter !== undefined) updateFields.examCenter = examCenter;

    // Check if rollNumber is changed and verify uniqueness
    if (rollNumber && String(rollNumber).trim() && String(rollNumber).trim() !== existing.rollNumber) {
      const candidateRoll = String(rollNumber).trim();
      const rollExists = await CompetitionApplication.findOne({
        rollNumber: candidateRoll,
        _id: { $ne: id }
      });
      if (rollExists) {
        return res.status(400).json({ message: `Roll Number '${candidateRoll}' is already assigned to another candidate.` });
      }
      updateFields.rollNumber = candidateRoll;
    }

    const updated = await CompetitionApplication.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    return res.json(formatAppResponse(updated));
  } catch (err) {
    console.error('Update competition application error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate roll number error', error: err.message });
    }
    if (err && (err.name === 'ValidationError' || err.name === 'CastError')) {
      return res.status(400).json({ message: 'Invalid data provided', error: err.message });
    }
    return res.status(500).json({ message: 'Failed to update application', error: err.message });
  }
};

router.put('/:id', updateCompetitionApplicationHandler);
router.patch('/:id', updateCompetitionApplicationHandler);

router.generateNextRollNumber = generateNextRollNumber;
router.parseDobToDate = parseDobToDate;
router.CURRENT_SESSION = CURRENT_SESSION;

module.exports = router;


