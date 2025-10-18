const Result = require('./models/Result');
const mongoose = require('mongoose');

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://khushalyadav535:FtYH71HzwoICm90w@cluster0.osata.mongodb.net/niict_admissions?retryWrites=true&w=majority&appName=Cluster0';

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Function to verify ranking
const verifyRanking = async () => {
  try {
    await mongoose.connect(mongoURI, options);
    console.log('✅ Connected to MongoDB');

    console.log('\n🏆 Top 10 Results by Marks:');
    const topResults = await Result.find({}).sort({ marks: -1 }).limit(10);
    topResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.rollNumber} - ${result.name} - ${result.marks} marks - Database Rank: ${result.rank}`);
    });

    console.log('\n🔍 Specific Check for Roll Number 1158:');
    const student1158 = await Result.findOne({ rollNumber: 'GK1158' });
    if (student1158) {
      console.log(`✅ Found: ${student1158.rollNumber} - ${student1158.name} - ${student1158.marks} marks - Rank: ${student1158.rank}`);
      
      // Check if this student has the highest marks
      const highestMarks = await Result.findOne({}).sort({ marks: -1 });
      if (highestMarks.rollNumber === student1158.rollNumber) {
        console.log('✅ This student has the highest marks and should be Rank 1');
      } else {
        console.log(`❌ This student is not the highest. Highest is: ${highestMarks.rollNumber} with ${highestMarks.marks} marks`);
      }
    } else {
      console.log('❌ Student with roll number GK1158 not found');
    }

  } catch (error) {
    console.error('❌ Error verifying ranking:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  }
};

// Run the verification
verifyRanking();
