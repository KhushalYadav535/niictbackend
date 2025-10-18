const mongoose = require('mongoose');
const Result = require('./models/Result');
const CompetitionApplication = require('./models/CompetitionApplication');
const Admission = require('./models/Admission');
require('dotenv').config();

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://khushalyadav535:FtYH71HzwoICm90w@cluster0.osata.mongodb.net/niict_admissions?retryWrites=true&w=majority&appName=Cluster0';

const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Function to push results to production
const pushResultsToProduction = async () => {
  console.log('\n🚀 Pushing Results to Production...');
  
  try {
    // Connect to local database
    await mongoose.connect(mongoURI, mongoOptions);
    console.log('✅ Connected to local MongoDB');

    // Get all results from local database
    const localResults = await Result.find({});
    console.log(`Found ${localResults.length} results in local database`);

    if (localResults.length === 0) {
      console.log('❌ No results found in local database');
      return;
    }

    // Prepare data for production API
    const resultsData = localResults.map(result => ({
      rollNumber: result.rollNumber,
      name: result.name,
      fatherName: result.fatherName,
      motherName: result.motherName,
      subject: result.subject,
      marks: result.marks,
      rank: result.rank,
      examDate: result.examDate,
      status: result.status,
      class: result.class,
      school: result.school,
      phone: result.phone,
      address: result.address,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      grade: result.grade,
      remarks: result.remarks,
      isPublished: result.isPublished,
      publishedAt: result.publishedAt,
      createdBy: result.createdBy
    }));

    // Push to production using bulk create API
    const https = require('https');
    const data = JSON.stringify({ results: resultsData });
    
    const requestOptions = {
      hostname: 'niictbackend.onrender.com',
      port: 443,
      path: '/api/results/bulk-create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = https.request(requestOptions, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });

    if (response.success) {
      console.log(`✅ Successfully pushed ${response.created} results to production`);
      if (response.errors && response.errors.length > 0) {
        console.log(`⚠️  ${response.errors.length} errors occurred during push`);
        response.errors.forEach(error => {
          console.log(`   - ${error.rollNumber}: ${error.error}`);
        });
      }
    } else {
      console.log(`❌ Failed to push results: ${response.message}`);
    }

  } catch (error) {
    console.error('❌ Error pushing results to production:', error.message);
  }
};

// Function to publish results on production
const publishResultsOnProduction = async () => {
  console.log('\n📢 Publishing Results on Production...');
  
  try {
    const https = require('https');
    const data = JSON.stringify({ publishAll: true });
    
    const publishOptions = {
      hostname: 'niictbackend.onrender.com',
      port: 443,
      path: '/api/results/publish',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = https.request(publishOptions, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });

    if (response.success) {
      console.log(`✅ Successfully published ${response.modifiedCount} results on production`);
    } else {
      console.log(`❌ Failed to publish results: ${response.message}`);
    }

  } catch (error) {
    console.error('❌ Error publishing results on production:', error.message);
  }
};

// Function to get production statistics
const getProductionStats = async () => {
  console.log('\n📊 Production Statistics:');
  
  try {
    const https = require('https');
    
    const statsOptions = {
      hostname: 'niictbackend.onrender.com',
      port: 443,
      path: '/api/results/stats',
      method: 'GET'
    };

    const response = await new Promise((resolve, reject) => {
      const req = https.request(statsOptions, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    if (response.success) {
      const stats = response.data;
      console.log(`📝 Total Results: ${stats.totalResults}`);
      console.log(`📢 Published Results: ${stats.publishedResults}`);
      console.log(`📋 Unpublished Results: ${stats.unpublishedResults}`);
      
      if (stats.subjectStats && stats.subjectStats.length > 0) {
        console.log('\n📊 Subject-wise Statistics:');
        stats.subjectStats.forEach(stat => {
          console.log(`   ${stat._id}: ${stat.totalStudents} students, Avg: ${stat.averageMarks.toFixed(2)} marks`);
        });
      }
    } else {
      console.log(`❌ Failed to get production stats: ${response.message}`);
    }

  } catch (error) {
    console.error('❌ Error getting production stats:', error.message);
  }
};

// Main function
const main = async () => {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'push':
        await pushResultsToProduction();
        break;
      case 'publish':
        await publishResultsOnProduction();
        break;
      case 'stats':
        await getProductionStats();
        break;
      case 'full':
        await pushResultsToProduction();
        await publishResultsOnProduction();
        await getProductionStats();
        break;
      default:
        console.log('Usage: node pushToProduction.js [push|publish|stats|full]');
        console.log('  push    - Push local results to production');
        console.log('  publish - Publish results on production');
        console.log('  stats   - Get production statistics');
        console.log('  full    - Push, publish, and show stats');
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  }
};

if (require.main === module) {
  main();
}

module.exports = { pushResultsToProduction, publishResultsOnProduction, getProductionStats };