const express = require('express');
const mongoose = require('mongoose');
const CompetitionApplication = require('./models/CompetitionApplication');
const Result = require('./models/Result');
const Admission = require('./models/Admission');
const Counter = require('./models/Counter');
const fs = require('fs');
require('dotenv').config();

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://khushalyadav535:FtYH71HzwoICm90w@cluster0.osata.mongodb.net/niict_admissions?retryWrites=true&w=majority&appName=Cluster0';

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Function to fetch data from production API
const fetchProductionData = async (endpoint) => {
  const https = require('https');
  return new Promise((resolve, reject) => {
    https.get(`https://niictbackend.onrender.com${endpoint}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.success ? parsed.data : parsed);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

// Function to sync Competition Applications
const syncCompetitionApplications = async () => {
  console.log('\n🔄 Syncing Competition Applications...');
  
  try {
    const productionData = await fetchProductionData('/api/competition-applications');
    console.log(`Found ${productionData.length} competition applications in production`);

    // Clear existing data
    await CompetitionApplication.deleteMany({});
    console.log('Cleared existing competition applications');

    // Reset counter
    await Counter.findOneAndUpdate(
      { _id: 'competition_roll' },
      { seq: 0 },
      { upsert: true }
    );
    console.log('Reset competition counter');

    // Insert production data
    let successCount = 0;
    let errorCount = 0;

    for (const record of productionData) {
      try {
        const { _id, __v, ...cleanRecord } = record;
        
        const applicationData = {
          ...cleanRecord,
          dateOfBirth: new Date(record.dateOfBirth),
          createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
          updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date()
        };

        await CompetitionApplication.create(applicationData);
        successCount++;
        
        if (successCount % 50 === 0) {
          console.log(`Processed ${successCount} competition applications...`);
        }
      } catch (error) {
        console.error(`Error inserting competition application ${record.rollNumber || record.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`✅ Competition Applications: ${successCount} imported, ${errorCount} failed`);

    // Update counter
    const maxRollNumber = await CompetitionApplication.aggregate([
      { $project: { rollNumInt: { $toInt: '$rollNumber' } } },
      { $sort: { rollNumInt: -1 } },
      { $limit: 1 }
    ]);

    if (maxRollNumber.length > 0) {
      const maxRoll = maxRollNumber[0].rollNumInt;
      const newSeq = Math.max(0, maxRoll - 1000);
      
      await Counter.findOneAndUpdate(
        { _id: 'competition_roll' },
        { seq: newSeq },
        { upsert: true }
      );
      
      console.log(`Updated competition counter to sequence: ${newSeq}`);
    }

  } catch (error) {
    console.error('Error syncing competition applications:', error.message);
  }
};

// Function to sync Results
const syncResults = async () => {
  console.log('\n🔄 Syncing Results...');
  
  try {
    const productionData = await fetchProductionData('/api/results/all');
    console.log(`Found ${productionData.length} results in production`);

    // Clear existing data
    await Result.deleteMany({});
    console.log('Cleared existing results');

    // Insert production data
    let successCount = 0;
    let errorCount = 0;

    for (const record of productionData) {
      try {
        const { _id, __v, ...cleanRecord } = record;
        
        const resultData = {
          ...cleanRecord,
          examDate: new Date(record.examDate),
          createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
          updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
          publishedAt: record.publishedAt ? new Date(record.publishedAt) : new Date()
        };

        await Result.create(resultData);
        successCount++;
        
        if (successCount % 50 === 0) {
          console.log(`Processed ${successCount} results...`);
        }
      } catch (error) {
        console.error(`Error inserting result ${record.rollNumber || record.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`✅ Results: ${successCount} imported, ${errorCount} failed`);

  } catch (error) {
    console.error('Error syncing results:', error.message);
  }
};

// Function to sync Admissions
const syncAdmissions = async () => {
  console.log('\n🔄 Syncing Admissions...');
  
  try {
    const productionData = await fetchProductionData('/api/admissions');
    console.log(`Found ${productionData.length} admissions in production`);

    // Clear existing data
    await Admission.deleteMany({});
    console.log('Cleared existing admissions');

    // Insert production data
    let successCount = 0;
    let errorCount = 0;

    for (const record of productionData) {
      try {
        const { _id, __v, ...cleanRecord } = record;
        
        const admissionData = {
          ...cleanRecord,
          dateOfBirth: new Date(record.dateOfBirth),
          createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
          updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date()
        };

        await Admission.create(admissionData);
        successCount++;
        
        if (successCount % 50 === 0) {
          console.log(`Processed ${successCount} admissions...`);
        }
      } catch (error) {
        console.error(`Error inserting admission ${record.rollNumber || record.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`✅ Admissions: ${successCount} imported, ${errorCount} failed`);

  } catch (error) {
    console.error('Error syncing admissions:', error.message);
  }
};

// Function to backup current local data
const backupLocalData = async () => {
  console.log('\n💾 Creating backup of local data...');
  
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      competitionApplications: await CompetitionApplication.find({}),
      results: await Result.find({}),
      admissions: await Admission.find({}),
      counters: await Counter.find({})
    };

    const backupFile = `./backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup created: ${backupFile}`);
    
    return backupFile;
  } catch (error) {
    console.error('Error creating backup:', error.message);
    return null;
  }
};

// Main sync function
async function syncAllData() {
  try {
    console.log('🚀 Starting Database Sync Process...');
    console.log('=' .repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(mongoURI, options);
    console.log('✅ Connected to MongoDB');

    // Create backup
    const backupFile = await backupLocalData();

    // Sync all data
    await syncCompetitionApplications();
    await syncResults();
    await syncAdmissions();

    // Final statistics
    console.log('\n📊 Final Statistics:');
    console.log('=' .repeat(30));
    
    const competitionCount = await CompetitionApplication.countDocuments();
    const resultsCount = await Result.countDocuments();
    const admissionsCount = await Admission.countDocuments();
    
    console.log(`📝 Competition Applications: ${competitionCount}`);
    console.log(`🏆 Results: ${resultsCount}`);
    console.log(`📋 Admissions: ${admissionsCount}`);
    
    if (backupFile) {
      console.log(`💾 Backup file: ${backupFile}`);
    }

    console.log('\n🎉 Database sync completed successfully!');
    console.log('All data has been synchronized from production to local database.');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const command = process.argv[2];

switch (command) {
  case 'competition':
    syncCompetitionApplications().then(() => process.exit(0));
    break;
  case 'results':
    syncResults().then(() => process.exit(0));
    break;
  case 'admissions':
    syncAdmissions().then(() => process.exit(0));
    break;
  case 'all':
  default:
    syncAllData();
    break;
}

module.exports = { syncAllData, syncCompetitionApplications, syncResults, syncAdmissions };
