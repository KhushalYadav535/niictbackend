const fs = require('fs');
const { PDFParse } = require('pdf-parse');

// Main function to extract text only
const extractTextOnly = async () => {
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
    
    // Show first 2000 characters to understand structure
    console.log('\nFirst 2000 characters of PDF text:');
    console.log('='.repeat(50));
    console.log(text.substring(0, 2000));
    console.log('='.repeat(50));
    
    // Show last 1000 characters
    console.log('\nLast 1000 characters of PDF text:');
    console.log('='.repeat(50));
    console.log(text.substring(text.length - 1000));
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Error during extraction:', error);
  }
};

// Run the extraction
if (require.main === module) {
  extractTextOnly();
}

module.exports = { extractTextOnly };
