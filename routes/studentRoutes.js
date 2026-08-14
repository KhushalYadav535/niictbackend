const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/students');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only jpeg, jpg, png, pdf files are allowed'));
    }
  }
});

// Upload fields
const uploadFields = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'marksheetCertificate', maxCount: 1 },
  { name: 'aadharCard', maxCount: 1 }
]);

// Get all students (optionally filtered by status)
router.get('/', async (req, res) => {
  try {
    const { status, session } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (session) filter.session = session;
    
    const students = await Student.find(filter).sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Failed to fetch students', error: err.message });
  }
});

// Get single student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ message: 'Failed to fetch student', error: err.message });
  }
});

// Create new student
router.post('/', uploadFields, async (req, res) => {
  try {
    const studentData = { ...req.body };
    
    // Handle file uploads
    if (req.files) {
      if (req.files.profilePhoto) {
        studentData.profilePhoto = '/uploads/students/' + req.files.profilePhoto[0].filename;
      }
      if (req.files.marksheetCertificate) {
        studentData.marksheetCertificate = '/uploads/students/' + req.files.marksheetCertificate[0].filename;
      }
      if (req.files.aadharCard) {
        studentData.aadharCard = '/uploads/students/' + req.files.aadharCard[0].filename;
      }
    }
    
    const student = new Student(studentData);
    const savedStudent = await student.save();
    
    res.status(201).json({
      message: 'Student added successfully',
      student: savedStudent
    });
  } catch (err) {
    console.error('Error adding student:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email or student ID already exists' });
    }
    res.status(400).json({ message: 'Failed to add student', error: err.message });
  }
});

// Update student
router.put('/:id', uploadFields, async (req, res) => {
  try {
    const studentData = { ...req.body };
    
    // Handle file uploads
    if (req.files) {
      if (req.files.profilePhoto) {
        studentData.profilePhoto = '/uploads/students/' + req.files.profilePhoto[0].filename;
      }
      if (req.files.marksheetCertificate) {
        studentData.marksheetCertificate = '/uploads/students/' + req.files.marksheetCertificate[0].filename;
      }
      if (req.files.aadharCard) {
        studentData.aadharCard = '/uploads/students/' + req.files.aadharCard[0].filename;
      }
    }
    
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      studentData,
      { new: true, runValidators: true }
    );
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ message: 'Student updated successfully', student });
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(400).json({ message: 'Failed to update student', error: err.message });
  }
});

// Update student status (pending/paid)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'paid'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be pending or paid' });
    }
    
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true }
    );
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ message: 'Student status updated successfully', student });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(400).json({ message: 'Failed to update status', error: err.message });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ message: 'Failed to delete student', error: err.message });
  }
});

module.exports = router;
