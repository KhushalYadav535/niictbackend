const fs = require('fs');
const { PDFParse } = require('pdf-parse');

// Function to extract results from PDF text
const extractResultsFromText = (text) => {
  const results = [];
  const seenRollNumbers = new Set(); // To track duplicate roll numbers
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
        line.includes('of') ||
        line.includes('TOP')) {
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
      
      // Skip if we've already seen this roll number
      if (seenRollNumbers.has(rollNumber)) {
        console.log(`Skipping duplicate roll number: ${rollNumber}`);
        continue;
      }
      seenRollNumbers.add(rollNumber);
      
      // Find marks (last part that's a number, possibly negative)
      let marks = 0;
      let marksIndex = -1;
      
      for (let j = parts.length - 1; j >= 0; j--) {
        const part = parts[j];
        // Check if it's a number (including negative) or 'A' for absent
        if (/^-?\d+\.?\d*$/.test(part) || part === 'A') {
          if (part === 'A') {
            marks = 0; // Absent students get 0 marks
          } else {
            marks = parseFloat(part);
          }
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
        rollNumber: `SK${rollNumber}`, // Prefix with SK for SK competition
        name: name.trim(),
        fatherName: fatherName.trim(),
        subject: 'Computer', // SK competition is Computer subject
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
  
  console.log(`Extracted ${results.length} unique student results`);
  return results;
};

// Main function to extract text and results
const extractSKResults = async () => {
  try {
    console.log('Reading SK PDF file...');
    const pdfBuffer = fs.readFileSync('./utils/SK.pdf');
    const pdfUint8Array = new Uint8Array(pdfBuffer);
    
    console.log('Parsing PDF...');
    const pdfData = await new PDFParse(pdfUint8Array);
    
    console.log('PDF parsed successfully');
    
    // Get text from PDF
    const textResult = await pdfData.getText();
    const text = textResult.text;
    console.log('PDF text length:', text.length);
    
    // Save raw text for debugging
    fs.writeFileSync('./utils/sk_pdf_text.txt', text);
    console.log('Raw PDF text saved to sk_pdf_text.txt for debugging');
    
    // Extract results from text
    console.log('Extracting results from PDF text...');
    const results = extractResultsFromText(text);
    
    if (results.length === 0) {
      console.log('No results found in PDF. Please check the PDF format and adjust the extraction logic.');
      return;
    }
    
    // Save results to JSON file
    fs.writeFileSync('./utils/sk_results.json', JSON.stringify(results, null, 2));
    console.log(`Results saved to sk_results.json`);
    
    // Show top 10 results
    console.log('\nTop 10 Results:');
    console.log('='.repeat(80));
    results.slice(0, 10).forEach((result, index) => {
      console.log(`${index + 1}. ${result.rollNumber} - ${result.name} - ${result.marks} marks - Rank ${result.rank}`);
    });
    
    // Check for AJAY specifically
    const ajayResult = results.find(r => r.rollNumber === 'SK1158');
    if (ajayResult) {
      console.log('\nAJAY (SK1158) Result:');
      console.log('='.repeat(50));
      console.log(`Roll Number: ${ajayResult.rollNumber}`);
      console.log(`Name: ${ajayResult.name}`);
      console.log(`Father's Name: ${ajayResult.fatherName}`);
      console.log(`Marks: ${ajayResult.marks}`);
      console.log(`Rank: ${ajayResult.rank}`);
      console.log(`Status: ${ajayResult.status}`);
    } else {
      console.log('\nAJAY (SK1158) not found in results');
    }
    
    console.log('\nSK Result extraction completed successfully!');
    
  } catch (error) {
    console.error('Error during extraction:', error);
  }
};

// Run the extraction
if (require.main === module) {
  extractSKResults();
}

module.exports = { extractSKResults, extractResultsFromText };
