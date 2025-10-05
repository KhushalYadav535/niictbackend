const express = require('express');
const mongoose = require('mongoose');
const CompetitionApplication = require('./models/CompetitionApplication');
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

async function syncDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI, options);
    console.log('Connected to MongoDB');

    // Fetch production data directly from API
    const https = require('https');
    const productionData = await new Promise((resolve, reject) => {
      https.get('https://niictbackend.onrender.com/api/competition-applications', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
    
    console.log(`Found ${productionData.length} records in production data`);

    // Clear existing data
    await CompetitionApplication.deleteMany({});
    console.log('Cleared existing competition applications');

    // Reset counter
    await Counter.findOneAndUpdate(
      { _id: 'competition_roll' },
      { seq: 0 },
      { upsert: true }
    );
    console.log('Reset counter');

    // Insert production data
    let successCount = 0;
    let errorCount = 0;

    for (const record of productionData) {
      try {
        // Remove _id and __v to avoid conflicts
        const { _id, __v, ...cleanRecord } = record;
        
        // Ensure required fields
        const applicationData = {
          ...cleanRecord,
          dateOfBirth: new Date(record.dateOfBirth),
          createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
          updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date()
        };

        await CompetitionApplication.create(applicationData);
        successCount++;
        
        if (successCount % 50 === 0) {
          console.log(`Processed ${successCount} records...`);
        }
      } catch (error) {
        console.error(`Error inserting record ${record.rollNumber || record.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\nSync completed:`);
    console.log(`✅ Successfully imported: ${successCount} records`);
    console.log(`❌ Failed to import: ${errorCount} records`);

    // Update counter to match the highest roll number
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
      
      console.log(`Updated counter to sequence: ${newSeq} (max roll number: ${maxRoll})`);
    }

    console.log('Database sync completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

syncDatabase();
