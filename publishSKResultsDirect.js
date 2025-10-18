const Result = require('./models/Result');
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://khushalyadav535:FtYH71HzwoICm90w@cluster0.osata.mongodb.net/niict_admissions?retryWrites=true&w=majority&appName=Cluster0';
    
    // MongoDB connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };
    
    await mongoose.connect(mongoURI, options);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to publish SK results
const publishSKResults = async () => {
  try {
    await connectDB();
    
    // Publish all SK results
    const result = await Result.updateMany(
      { rollNumber: { $regex: /^SK/ } },
      { isPublished: true, publishedAt: new Date() }
    );
    
    console.log(`Published ${result.modifiedCount} SK results`);
    
    // Check AJAY specifically
    const ajayResult = await Result.findOne({ rollNumber: 'SK1158' });
    if (ajayResult) {
      console.log('\nAJAY (SK1158) in Database:');
      console.log('='.repeat(50));
      console.log(`Roll Number: ${ajayResult.rollNumber}`);
      console.log(`Name: ${ajayResult.name}`);
      console.log(`Father's Name: ${ajayResult.fatherName}`);
      console.log(`Marks: ${ajayResult.marks}`);
      console.log(`Rank: ${ajayResult.rank}`);
      console.log(`Status: ${ajayResult.status}`);
      console.log(`Subject: ${ajayResult.subject}`);
      console.log(`Is Published: ${ajayResult.isPublished}`);
    } else {
      console.log('\nAJAY (SK1158) not found in database');
    }
    
    // Show top 10 SK results
    console.log('\nTop 10 SK Results:');
    console.log('='.repeat(80));
    const topResults = await Result.find({ 
      rollNumber: { $regex: /^SK/ },
      isPublished: true 
    })
      .sort({ marks: -1 })
      .limit(10);
    
    topResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.rollNumber} - ${result.name} - ${result.marks} marks - Rank ${result.rank}`);
    });
    
    console.log('\nSK Results published successfully!');
    
  } catch (error) {
    console.error('Error publishing SK results:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the publish operation
if (require.main === module) {
  publishSKResults();
}

module.exports = { publishSKResults };
