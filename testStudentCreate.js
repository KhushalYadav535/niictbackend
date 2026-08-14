const mongoose = require('mongoose');
const Student = require('./models/Student');
require('dotenv').config();

const testStudents = [
  {
    studentName: 'MOHD ADIL 01-01-2003',
    session: '2022-23',
    courseType: 'ADCA',
    courseInterest: 'ADVANCE DIPLOMA IN COMPUTER APPLICATION -(ADCA) - 1 YEAR',
    fatherName: 'Mohd Ismail',
    motherName: 'Fatima Begum',
    mobile: '8182838880',
    email: 'mohdadil@example.com',
    dob: new Date('2003-01-01'),
    gender: 'male',
    qualification: '12th',
    address: '123 Main Street, Delhi',
    status: 'paid'
  },
  {
    studentName: 'SUDHAKAR YADAV 06-03-2000',
    session: '2022-23',
    courseType: 'ADCA',
    courseInterest: 'ADVANCE DIPLOMA IN COMPUTER APPLICATION -(ADCA) - 1 YEAR',
    fatherName: 'Ram Kishore Yadav',
    motherName: 'Sarla Devi',
    mobile: '8182838880',
    email: 'sudhakaryadav@example.com',
    dob: new Date('2000-03-06'),
    gender: 'male',
    qualification: 'Graduate',
    address: '456 Park Avenue, Noida',
    status: 'paid'
  },
  {
    studentName: 'SHUBHAM YADAV 01-01-2004',
    session: '2023-24',
    courseType: 'ADCA',
    courseInterest: '(ADCA) ADVANCE DIPLOMA IN COMPUTER APPLICATION 1 YEAR',
    fatherName: 'Rajesh Yadav',
    motherName: 'Meera Yadav',
    mobile: '8182838880',
    email: 'shubhamyadav@example.com',
    dob: new Date('2004-01-01'),
    gender: 'male',
    qualification: '10th',
    address: '789 Green Avenue, Gurugram',
    status: 'pending'
  },
  {
    studentName: 'SHRIYANSH DUBEY',
    session: '2024-25',
    courseType: 'ADCA',
    courseInterest: 'ADVANCE DIPLOMA IN COMPUTER APPLICATION (ADCA) -1 YEAR',
    fatherName: 'Anil Dubey',
    motherName: 'Rashmi Dubey',
    mobile: '9670027110',
    email: 'shriyanshdubey@example.com',
    dob: new Date('2006-05-15'),
    gender: 'male',
    qualification: '12th',
    address: '101 Skyline Apartments, Mumbai',
    status: 'pending'
  }
];

async function createTestStudents() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/niict',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    );
    console.log('Connected successfully!');
    
    console.log('Creating test students...');
    const createdStudents = [];
    
    for (const studentData of testStudents) {
      try {
        const student = new Student(studentData);
        const savedStudent = await student.save();
        createdStudents.push(savedStudent);
        console.log(`Created student: ${savedStudent.studentName} (ID: ${savedStudent.studentId})`);
      } catch (err) {
        console.log(`Skipping duplicate student: ${studentData.studentName} - ${err.message}`);
      }
    }
    
    console.log(`Created ${createdStudents.length} test students successfully!`);
    
  } catch (error) {
    console.error('Error creating test students:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestStudents();
