const CompetitionApplication = require('../models/CompetitionApplication');
const Admission = require('../models/Admission');

/**
 * Generate next serial roll number starting from 1001
 * @param {string} type - 'competition' or 'admission'
 * @returns {Promise<string>} - Next available roll number
 */
async function generateSerialRollNumber(type = 'competition') {
  try {
    let Model;
    let prefix = '';
    
    if (type === 'competition') {
      Model = CompetitionApplication;
      prefix = 'C'; // Competition prefix
    } else if (type === 'admission') {
      Model = Admission;
      prefix = 'A'; // Admission prefix
    } else {
      throw new Error('Invalid type. Must be "competition" or "admission"');
    }

    // Find the highest existing roll number
    const lastRecord = await Model.findOne(
      { rollNumber: { $regex: `^${prefix}\\d{4}$` } },
      {},
      { sort: { rollNumber: -1 } }
    );

    let nextNumber;
    if (lastRecord) {
      // Extract number from last roll number (e.g., "C1005" -> 1005)
      const lastNumber = parseInt(lastRecord.rollNumber.substring(1));
      nextNumber = lastNumber + 1;
    } else {
      // Start from 1001 if no records exist
      nextNumber = 1001;
    }

    const rollNumber = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    
    // Double-check uniqueness (safety measure)
    const exists = await Model.findOne({ rollNumber });
    if (exists) {
      // If somehow it exists, try next number
      return await generateSerialRollNumber(type);
    }

    return rollNumber;
  } catch (error) {
    console.error('Error generating serial roll number:', error);
    throw error;
  }
}

/**
 * Generate simple serial roll number without prefix (for backward compatibility)
 * Starts fresh from 1001, ignoring all existing random/timestamp-based roll numbers
 * @returns {Promise<string>} - Next available roll number starting from 1001
 */
async function generateSimpleSerialRollNumber() {
  try {
    // First, check if 1001 is available
    const check1001 = await CompetitionApplication.findOne({ rollNumber: '1001' });
    const check1001Adm = await Admission.findOne({ rollNumber: '1001' });
    
    if (!check1001 && !check1001Adm) {
      console.log(`Generated new serial roll number: 1001`);
      return '1001';
    }
    
    // If 1001 is taken, find the next available number starting from 1002
    // Get all existing roll numbers to find gaps
    const allCompetitionRolls = await CompetitionApplication.find({}, 'rollNumber');
    const allAdmissionRolls = await Admission.find({}, 'rollNumber');
    
    // Combine all roll numbers and convert to integers
    const allRollNumbers = [
      ...allCompetitionRolls.map(app => parseInt(app.rollNumber)),
      ...allAdmissionRolls.map(adm => parseInt(adm.rollNumber)).filter(num => !isNaN(num))
    ].filter(num => num >= 1001 && num <= 9999).sort((a, b) => a - b);
    
    // Find the first gap starting from 1001
    let nextNumber = 1001;
    for (const existingNumber of allRollNumbers) {
      if (existingNumber === nextNumber) {
        nextNumber++;
      } else if (existingNumber > nextNumber) {
        // Found a gap
        break;
      }
    }
    
    // Ensure we don't exceed 9999
    if (nextNumber > 9999) {
      throw new Error('Maximum roll number limit reached (9999)');
    }
    
    const rollNumber = nextNumber.toString().padStart(4, '0');
    
    // Double-check uniqueness (safety measure)
    const compExists = await CompetitionApplication.findOne({ rollNumber });
    const admExists = await Admission.findOne({ rollNumber });
    
    if (compExists || admExists) {
      // If somehow it exists, try next number recursively
      return await generateSimpleSerialRollNumber();
    }

    console.log(`Generated new serial roll number: ${rollNumber}`);
    return rollNumber;
    
  } catch (error) {
    console.error('Error generating simple serial roll number:', error);
    throw error;
  }
}

module.exports = {
  generateSerialRollNumber,
  generateSimpleSerialRollNumber
};
