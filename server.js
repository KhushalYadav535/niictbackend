const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://khushalyadav535:FtYH71HzwoICm90w@cluster0.osata.mongodb.net/niict_admissions?retryWrites=true&w=majority&appName=Cluster0';

// MongoDB connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, options);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

// Routes
const admissionRoutes = require('./routes/admissionRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const competitionRoutes = require('./routes/competitionRoutes');
const resultRoutes = require('./routes/resultRoutes');
const courseRoutes = require('./routes/courseRoutes');
const jobRoutes = require('./routes/jobRoutes');
const newsRoutes = require('./routes/newsRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const paperRoutes = require('./routes/paperRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const authRoutes = require('./routes/authRoutes');
const doubtRoutes = require('./routes/doubtRoutes');
const testRoutes = require('./routes/testRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const franchiseRoutes = require('./routes/franchiseRoutes');
const studentRoutes = require('./routes/studentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/admissions', admissionRoutes);
app.use('/api', uploadRoutes);
app.use('/api/competition-applications', competitionRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/doubts', doubtRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/franchise', franchiseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payment', paymentRoutes);

// Ensure uploads directory exists and serve it statically
const uploadsDir = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.error('Failed to ensure uploads directory:', e);
}
app.use('/uploads', express.static(uploadsDir));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
