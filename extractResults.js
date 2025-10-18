const fs = require('fs');
const { PDFParse } = require('pdf-parse');
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

// Function to extract results from PDF text
const extractResultsFromText = (text) => {
  const results = [];
  const lines = text.split('\n');
  
  console.log('Total lines in PDF:', lines.length);
  
  // Skip header lines and process data lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines, headers, and page numbers
    if (!line || 
        line.includes('Roll') || 
        line.includes('Number') || 
        line.includes('Full Name') || 
        line.includes('Father') ||
        line.includes('Marks') ||
        line.includes('--') ||
        line.includes('of')) {
      continue;
    }
    
    // Parse student data line
    // Format: "1277 SHIVENDRA PRATAP SINGH SHREE VINDHY KUMAR SINGH 4.89"
    const parts = line.split(/\s+/);
    
    if (parts.length >= 4) {
      const rollNumber = parts[0];
      
      // Validate roll number (should be 4 digits)
      if (!/^\d{4}$/.test(rollNumber)) {
        continue;
      }
      
      // Find marks (last part that's a number, possibly negative)
      let marks = 0;
      let marksIndex = -1;
      
      for (let j = parts.length - 1; j >= 0; j--) {
        const part = parts[j];
        // Check if it's a number (including negative)
        if (/^-?\d+\.?\d*$/.test(part) && part !== 'A') {
          marks = parseFloat(part);
          marksIndex = j;
          break;
        }
      }
      
      if (marksIndex === -1) {
        console.log(`No marks found for roll number ${rollNumber}`);
        continue;
      }
      
      // Extract name and father's name
      const nameParts = parts.slice(1, marksIndex);
      
      if (nameParts.length < 2) {
        console.log(`Insufficient data for roll number ${rollNumber}`);
        continue;
      }
      
      // Try to separate name and father's name
      // This is tricky as we don't know where the name ends and father's name begins
      // We'll assume the last 2-3 parts are father's name
      let name = '';
      let fatherName = '';
      
      if (nameParts.length >= 4) {
        // Take first 2-3 parts as name, rest as father's name
        const nameEndIndex = Math.min(3, Math.floor(nameParts.length / 2));
        name = nameParts.slice(0, nameEndIndex).join(' ');
        fatherName = nameParts.slice(nameEndIndex).join(' ');
      } else {
        // If only 2-3 parts, assume first is name, rest is father's name
        name = nameParts[0];
        fatherName = nameParts.slice(1).join(' ');
      }
      
      // Create student result object
      const studentResult = {
        rollNumber: `GK${rollNumber}`, // Prefix with GK for GK competition
        name: name.trim(),
        fatherName: fatherName.trim(),
        subject: 'GK', // This appears to be GK competition results
        marks: Math.max(0, marks), // Ensure marks are not negative for display
        rank: 0, // Will be calculated later
        examDate: new Date('2024-10-18'),
        status: marks >= 0 ? 'Passed' : 'Failed',
        isPublished: false
      };
      
      results.push(studentResult);
    }
  }
  
  // Sort by marks (descending) and assign ranks
  results.sort((a, b) => b.marks - a.marks);
  results.forEach((result, index) => {
    result.rank = index + 1;
  });
  
  console.log(`Extracted ${results.length} student results`);
  return results;
};

// Function to save results to database
const saveResultsToDatabase = async (results) => {
  console.log(`\nFound ${results.length} results to process`);
  
  let saved = 0;
  let updated = 0;
  let errors = 0;
  
  for (const resultData of results) {
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
        console.log(`Updated: ${resultData.rollNumber} - ${resultData.name}`);
      } else {
        // Create new result
        const newResult = new Result(resultData);
        await newResult.save();
        saved++;
        console.log(`Saved: ${resultData.rollNumber} - ${resultData.name}`);
      }
    } catch (error) {
      errors++;
      console.error(`Error processing ${resultData.rollNumber}:`, error.message);
    }
  }
  
  console.log(`\nSummary:`);
  console.log(`- New results saved: ${saved}`);
  console.log(`- Existing results updated: ${updated}`);
  console.log(`- Errors: ${errors}`);
};

// Main function
const extractAndSaveResults = async () => {
  try {
    await connectDB();
    
    console.log('Reading PDF file...');
    const pdfBuffer = fs.readFileSync('./utils/RESULT 2025.pdf');
    const pdfUint8Array = new Uint8Array(pdfBuffer);
    
    console.log('Parsing PDF...');
    const pdfData = await new PDFParse(pdfUint8Array);
    
    console.log('PDF parsed successfully');
    
    // Get text from PDF
    const textResult = await pdfData.getText();
    console.log('Text result type:', typeof textResult);
    console.log('Text result methods:', Object.getOwnPropertyNames(textResult));
    
    // Try to get the actual text
    const text = textResult.text || textResult.toString() || JSON.stringify(textResult);
    console.log('PDF text length:', text.length);
    
    // Save raw text for debugging
    fs.writeFileSync('./utils/pdf_text.txt', text);
    console.log('Raw PDF text saved to pdf_text.txt for debugging');
    
    // Extract results from text
    console.log('Extracting results from PDF text...');
    const results = extractResultsFromText(text);
    
    if (results.length === 0) {
      console.log('No results found in PDF. Please check the PDF format and adjust the extraction logic.');
      console.log('First 1000 characters of PDF text:');
      console.log(text.substring(0, 1000));
      return;
    }
    
    // Save results to database
    await saveResultsToDatabase(results);
    
    console.log('\nResult extraction completed successfully!');
    
  } catch (error) {
    console.error('Error during extraction:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the extraction
if (require.main === module) {
  extractAndSaveResults();
}

module.exports = { extractAndSaveResults, extractResultsFromText };
