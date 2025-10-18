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

// Function to fix ranking
const fixRanking = async () => {
  try {
    await mongoose.connect(mongoURI, options);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Current Top 10 Results:');
    const currentResults = await Result.find({}).sort({ marks: -1 }).limit(10);
    currentResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.rollNumber} - ${result.name} - ${result.marks} marks - Current Rank: ${result.rank}`);
    });

    console.log('\n🔄 Fixing Rankings...');
    
    // Get all results sorted by marks (descending)
    const allResults = await Result.find({}).sort({ marks: -1 });
    
    // Update ranks
    for (let i = 0; i < allResults.length; i++) {
      const result = allResults[i];
      const correctRank = i + 1;
      
      if (result.rank !== correctRank) {
        await Result.findByIdAndUpdate(result._id, { rank: correctRank });
        console.log(`Updated ${result.rollNumber} - ${result.name}: Rank ${result.rank} → ${correctRank}`);
      }
    }

    console.log('\n✅ Ranking Fixed! New Top 10 Results:');
    const updatedResults = await Result.find({}).sort({ marks: -1 }).limit(10);
    updatedResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.rollNumber} - ${result.name} - ${result.marks} marks - Rank: ${result.rank}`);
    });

    console.log('\n🎯 Summary:');
    console.log(`- Total results processed: ${allResults.length}`);
    console.log(`- Rankings corrected based on marks`);
    console.log(`- Highest marks: ${allResults[0].marks} (${allResults[0].name})`);

  } catch (error) {
    console.error('❌ Error fixing ranking:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  }
};

// Run the fix
fixRanking();
