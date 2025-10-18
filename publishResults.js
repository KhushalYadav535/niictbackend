const Result = require('./models/Result');
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/niict';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to publish all results
const publishAllResults = async () => {
  try {
    await connectDB();
    
    console.log('Publishing all results...');
    
    // Update all results to be published
    const result = await Result.updateMany(
      {}, // Update all documents
      { 
        isPublished: true, 
        publishedAt: new Date() 
      }
    );
    
    console.log(`Successfully published ${result.modifiedCount} results`);
    
    // Get some statistics
    const totalResults = await Result.countDocuments();
    const publishedResults = await Result.countDocuments({ isPublished: true });
    
    console.log(`\nStatistics:`);
    console.log(`- Total results in database: ${totalResults}`);
    console.log(`- Published results: ${publishedResults}`);
    console.log(`- Unpublished results: ${totalResults - publishedResults}`);
    
    // Show top 10 results
    const topResults = await Result.find({ isPublished: true })
      .sort({ rank: 1 })
      .limit(10)
      .select('rollNumber name marks rank');
    
    console.log(`\nTop 10 Results:`);
    topResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.rollNumber} - ${result.name} - ${result.marks} marks - Rank #${result.rank}`);
    });
    
  } catch (error) {
    console.error('Error publishing results:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
  }
};

// Function to test result search
const testResultSearch = async () => {
  try {
    await connectDB();
    
    console.log('Testing result search functionality...');
    
    // Get a few sample roll numbers
    const sampleResults = await Result.find({ isPublished: true })
      .limit(5)
      .select('rollNumber name');
    
    console.log('\nTesting search for sample roll numbers:');
    
    for (const result of sampleResults) {
      const foundResult = await Result.findOne({ 
        rollNumber: result.rollNumber,
        isPublished: true 
      });
      
      if (foundResult) {
        console.log(`✅ Found: ${foundResult.rollNumber} - ${foundResult.name} - ${foundResult.marks} marks - Rank #${foundResult.rank}`);
      } else {
        console.log(`❌ Not found: ${result.rollNumber}`);
      }
    }
    
  } catch (error) {
    console.error('Error testing result search:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
  }
};

// Main function
const main = async () => {
  const command = process.argv[2];
  
  switch (command) {
    case 'publish':
      await publishAllResults();
      break;
    case 'test':
      await testResultSearch();
      break;
    default:
      console.log('Usage: node publishResults.js [publish|test]');
      console.log('  publish - Publish all results so students can search for them');
      console.log('  test    - Test the result search functionality');
  }
};

if (require.main === module) {
  main();
}

module.exports = { publishAllResults, testResultSearch };
