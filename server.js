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
app.use('/api/admissions', admissionRoutes);
app.use('/api', uploadRoutes);
app.use('/api/competition-applications', competitionRoutes);
app.use('/api/results', resultRoutes);

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
