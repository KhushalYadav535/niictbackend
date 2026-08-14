const mongoose = require('mongoose');
const Franchise = require('./models/Franchise');
require('dotenv').config();

// Test franchise data
const testFranchise = {
  instituteName: 'Test Computer Institute',
  ownerName: 'Rajesh Kumar',
  dob: new Date('1985-05-15'),
  pan: 'ABCDE1234F',
  gst: '22AAAAA0000A1Z5',
  contact1: '9876543210',
  contact2: '8765432109',
  whatsapp: '9876543210',
  email: 'test.franchise@example.com',
  ownerAddress: '123, Main Road, Delhi',
  instituteAddress: '456, Business Park, Delhi',
  pinCode: '110001',
  district: 'Central Delhi',
  state: 'Delhi',
  password: 'password123'
};

async function createTestFranchise() {
  try {
    console.log('Connecting to database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/niict', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database successfully!');
    
    // Check if franchise already exists
    const existingFranchise = await Franchise.findOne({ email: testFranchise.email });
    if (existingFranchise) {
      console.log('Franchise with this email already exists!');
      console.log('Existing franchise:', existingFranchise._id);
      process.exit(0);
    }
    
    // Create new franchise
    console.log('Creating test franchise...');
    const franchise = new Franchise(testFranchise);
    const newFranchise = await franchise.save();
    
    console.log('✓ Test franchise created successfully!');
    console.log('Franchise details:', {
      _id: newFranchise._id,
      instituteName: newFranchise.instituteName,
      ownerName: newFranchise.ownerName,
      email: newFranchise.email,
      status: newFranchise.status
    });
    
  } catch (error) {
    console.error('Error creating test franchise:', error.message);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
}

createTestFranchise();
