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
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(mongoURI, options);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to fix duplicate ranking
const fixDuplicateRanking = async () => {
  try {
    await connectDB();
    
    console.log('Checking for duplicate entries...');
    
    // Find all results
    const allResults = await Result.find({ isPublished: true }).sort({ marks: -1 });
    console.log(`Total published results: ${allResults.length}`);
    
    // Group by roll number to find duplicates
    const rollNumberGroups = {};
    allResults.forEach(result => {
      const baseRollNumber = result.rollNumber.replace(/^(GK|SK)/, '');
      if (!rollNumberGroups[baseRollNumber]) {
        rollNumberGroups[baseRollNumber] = [];
      }
      rollNumberGroups[baseRollNumber].push(result);
    });
    
    // Find duplicates
    const duplicates = Object.entries(rollNumberGroups).filter(([roll, results]) => results.length > 1);
    console.log(`Found ${duplicates.length} duplicate roll numbers`);
    
    if (duplicates.length > 0) {
      console.log('\nDuplicate entries:');
      duplicates.forEach(([roll, results]) => {
        console.log(`Roll ${roll}:`);
        results.forEach(result => {
          console.log(`  - ${result.rollNumber} - ${result.name} - ${result.marks} marks - Rank ${result.rank}`);
        });
      });
      
      // Ask for confirmation
      console.log('\nDo you want to delete duplicate entries? (This will keep only the latest entry for each roll number)');
      console.log('Deleting duplicates...');
      
      let deletedCount = 0;
      for (const [roll, results] of duplicates) {
        // Keep the latest entry (highest _id or most recent)
        const latestResult = results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        const toDelete = results.filter(r => r._id.toString() !== latestResult._id.toString());
        
        for (const result of toDelete) {
          await Result.findByIdAndDelete(result._id);
          deletedCount++;
          console.log(`Deleted: ${result.rollNumber} - ${result.name}`);
        }
      }
      
      console.log(`\nDeleted ${deletedCount} duplicate entries`);
    }
    
    // Recalculate ranks for all results
    console.log('\nRecalculating ranks...');
    const remainingResults = await Result.find({ isPublished: true }).sort({ marks: -1 });
    
    for (let i = 0; i < remainingResults.length; i++) {
      const result = remainingResults[i];
      const newRank = i + 1;
      
      if (result.rank !== newRank) {
        await Result.findByIdAndUpdate(result._id, { rank: newRank });
        console.log(`Updated rank for ${result.rollNumber} - ${result.name}: ${result.rank} → ${newRank}`);
      }
    }
    
    // Show final top 10 results
    console.log('\nFinal Top 10 Results:');
    console.log('='.repeat(80));
    const finalResults = await Result.find({ isPublished: true })
      .sort({ marks: -1 })
      .limit(10);
    
    finalResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.rollNumber} - ${result.name} - ${result.marks} marks - Rank ${result.rank}`);
    });
    
    // Check AJAY specifically
    const ajayResults = await Result.find({ 
      $or: [{ rollNumber: 'SK1158' }, { rollNumber: 'GK1158' }],
      isPublished: true 
    });
    
    console.log('\nAJAY Results:');
    console.log('='.repeat(50));
    ajayResults.forEach(result => {
      console.log(`${result.rollNumber} - ${result.name} - ${result.marks} marks - Rank ${result.rank}`);
    });
    
    console.log('\nDuplicate ranking fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing duplicate ranking:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the fix operation
if (require.main === module) {
  fixDuplicateRanking();
}

module.exports = { fixDuplicateRanking };
