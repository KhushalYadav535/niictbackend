const fs = require('fs');
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

// Function to save SK results to database
const saveSKResultsToDatabase = async () => {
  try {
    await connectDB();
    
    // Read the extracted results
    const resultsData = JSON.parse(fs.readFileSync('./utils/sk_results.json', 'utf8'));
    console.log(`Found ${resultsData.length} SK results to save`);
    
    let saved = 0;
    let updated = 0;
    let errors = 0;
    
    for (const resultData of resultsData) {
      try {
        // Check if result already exists
        const existingResult = await Result.findOne({ 
          rollNumber: resultData.rollNumber 
        });
        
        if (existingResult) {
          // Update existing result
          await Result.findByIdAndUpdate(
            existingResult._id,
            resultData,
            { new: true, runValidators: true }
          );
          updated++;
          console.log(`Updated: ${resultData.rollNumber} - ${resultData.name} - Rank ${resultData.rank}`);
        } else {
          // Create new result
          const newResult = new Result(resultData);
          await newResult.save();
          saved++;
          console.log(`Saved: ${resultData.rollNumber} - ${resultData.name} - Rank ${resultData.rank}`);
        }
      } catch (error) {
        errors++;
        console.error(`Error processing ${resultData.rollNumber}:`, error.message);
      }
    }
    
    console.log(`\nSK Results Summary:`);
    console.log(`- New results saved: ${saved}`);
    console.log(`- Existing results updated: ${updated}`);
    console.log(`- Errors: ${errors}`);
    
    // Show top 10 SK results
    console.log('\nTop 10 SK Results in Database:');
    console.log('='.repeat(80));
    const topResults = await Result.find({ subject: 'SK' })
      .sort({ marks: -1 })
      .limit(10);
    
    topResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.rollNumber} - ${result.name} - ${result.marks} marks - Rank ${result.rank}`);
    });
    
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
    
    console.log('\nSK Results saved to database successfully!');
    
  } catch (error) {
    console.error('Error saving SK results:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the save operation
if (require.main === module) {
  saveSKResultsToDatabase();
}

module.exports = { saveSKResultsToDatabase };
