const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const CompetitionApplication = require('../models/CompetitionApplication');

// Universal result search (public endpoint) - supports roll number, phone, aadhaar
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { dob } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }

    const cleanInput = query.toUpperCase().trim();
    const numMatch = cleanInput.match(/\d+/);
    const numPart = numMatch ? numMatch[0] : '';

    const orConditions = [
      { rollNumber: cleanInput },
      { rollNumber: `NIICT${cleanInput}` }
    ];

    if (numPart) {
      orConditions.push(
        { numericRoll: numPart },
        { rollNumber: `NIICT${numPart}` },
        { rollNumber: `GK${numPart}` },
        { rollNumber: `SK${numPart}` },
        { rollNumber: numPart }
      );
    }

    // Phone search (10-digit)
    if (/^\d{10}$/.test(cleanInput)) {
      orConditions.push({ phone: cleanInput });
    }

    // Aadhaar search (12-digit)
    if (/^\d{12}$/.test(cleanInput)) {
      orConditions.push({ aadhaar: cleanInput });
    }

    // Try finding directly in Result collection (prefer newest session)
    let publishedResult = await Result.findOne({ 
      $or: orConditions,
      isPublished: true 
    }).sort({ session: -1, createdAt: -1 });

    // Fallback: If not found directly, check CompetitionApplication to resolve student
    if (!publishedResult) {
      const appConditions = [
        { rollNumber: cleanInput },
        { rollNumber: `NIICT${cleanInput}` }
      ];

      if (numPart) {
        appConditions.push(
          { rollNumber: `NIICT${numPart}` },
          { rollNumber: numPart }
        );
      }

      if (/^\d{10}$/.test(cleanInput)) {
        appConditions.push({ phone: cleanInput }, { parentPhone: cleanInput });
      }

      if (/^\d{12}$/.test(cleanInput)) {
        appConditions.push({ aadhaar: cleanInput });
      }

      const matchedApp = await CompetitionApplication.findOne({ $or: appConditions });
      if (matchedApp && matchedApp.rollNumber) {
        const appRoll = matchedApp.rollNumber.toUpperCase().trim();
        const appNum = (appRoll.match(/\d+/) || [])[0];
        
        publishedResult = await Result.findOne({
          $or: [
            { rollNumber: appRoll },
            { numericRoll: appNum },
            { rollNumber: `NIICT${appNum}` }
          ],
          isPublished: true
        });
      }
    }

    if (!publishedResult) {
      return res.status(404).json({ 
        success: false, 
        message: `No result found for "${cleanInput}". Please verify your Roll Number, Mobile Number, or Aadhaar and try again.`,
        isPublished: true
      });
    }

    res.json({
      success: true,
      data: publishedResult,
      message: 'Result found successfully'
    });

  } catch (error) {
    console.error('Error searching result:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Comprehensive lookup endpoint (POST)
router.post('/lookup', async (req, res) => {
  try {
    const { rollNumber, mobile, aadhaar, dob } = req.body;

    if (!rollNumber && !mobile && !aadhaar) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Roll Number, Mobile Number, or Aadhaar Number.'
      });
    }

    let queryParam = '';
    if (rollNumber && rollNumber.trim()) {
      queryParam = rollNumber.trim();
    } else if (mobile && mobile.trim()) {
      queryParam = mobile.trim();
    } else if (aadhaar && aadhaar.trim()) {
      queryParam = aadhaar.trim();
    }

    const cleanInput = queryParam.toUpperCase().trim();
    const numMatch = cleanInput.match(/\d+/);
    const numPart = numMatch ? numMatch[0] : '';

    const orConditions = [
      { rollNumber: cleanInput },
      { rollNumber: `NIICT${cleanInput}` }
    ];

    if (numPart) {
      orConditions.push(
        { numericRoll: numPart },
        { rollNumber: `NIICT${numPart}` },
        { rollNumber: `GK${numPart}` },
        { rollNumber: `SK${numPart}` },
        { rollNumber: numPart }
      );
    }

    if (/^\d{10}$/.test(cleanInput)) {
      orConditions.push({ phone: cleanInput });
    }

    if (/^\d{12}$/.test(cleanInput)) {
      orConditions.push({ aadhaar: cleanInput });
    }

    let publishedResult = await Result.findOne({
      $or: orConditions,
      isPublished: true
    }).sort({ session: -1, createdAt: -1 });

    if (!publishedResult) {
      const appConditions = [{ rollNumber: cleanInput }, { rollNumber: `NIICT${cleanInput}` }];
      if (numPart) {
        appConditions.push({ rollNumber: `NIICT${numPart}` }, { rollNumber: numPart });
      }
      if (/^\d{10}$/.test(cleanInput)) {
        appConditions.push({ phone: cleanInput }, { parentPhone: cleanInput });
      }
      if (/^\d{12}$/.test(cleanInput)) {
        appConditions.push({ aadhaar: cleanInput });
      }

      const matchedApp = await CompetitionApplication.findOne({ $or: appConditions });
      if (matchedApp && matchedApp.rollNumber) {
        const appRoll = matchedApp.rollNumber.toUpperCase().trim();
        const appNum = (appRoll.match(/\d+/) || [])[0];
        
        publishedResult = await Result.findOne({
          $or: [
            { rollNumber: appRoll },
            { numericRoll: appNum },
            { rollNumber: `NIICT${appNum}` }
          ],
          isPublished: true
        });
      }
    }

    if (!publishedResult) {
      return res.status(404).json({
        success: false,
        message: 'No result found matching your entered details. Please check and try again.'
      });
    }

    res.json({
      success: true,
      data: publishedResult,
      message: 'Result found successfully'
    });
  } catch (error) {
    console.error('Error in result lookup:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all results (admin only)
router.get('/all', async (req, res) => {
  try {
    const results = await Result.find({ isPublished: true })
      .sort({ rank: 1, subject: 1 })
      .select('-__v');

    res.json({
      success: true,
      data: results,
      count: results.length
    });

  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get results by subject (admin only)
router.get('/subject/:subject', async (req, res) => {
  try {
    const { subject } = req.params;

    const results = await Result.find({ 
      subject: subject,
      isPublished: true 
    })
      .sort({ rank: 1 })
      .select('-__v');

    res.json({
      success: true,
      data: results,
      count: results.length
    });

  } catch (error) {
    console.error('Error fetching results by subject:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get top performers (admin only)
router.get('/top/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    
    const topResults = await Result.find({ isPublished: true })
      .sort({ session: -1, rank: 1 })
      .limit(limit)
      .select('-__v');

    res.json({
      success: true,
      data: topResults,
      count: topResults.length
    });

  } catch (error) {
    console.error('Error fetching top results:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get top 3 students (public endpoint for result display)
router.get('/top3/:subject?', async (req, res) => {
  try {
    // Prefer Session 2026-2027 top 3
    let query = { isPublished: true, session: '2026-2027' };
    const count2026 = await Result.countDocuments(query);
    if (count2026 === 0) {
      delete query.session;
    }
    
    const top3Results = await Result.find(query)
      .sort({ rank: 1, marks: -1 })
      .limit(3)
      .select('name fatherName rollNumber marks rank subject phone status percentage grade school')
      .lean();

    res.json({
      success: true,
      data: top3Results,
      count: top3Results.length
    });

  } catch (error) {
    console.error('Error fetching top 3 results:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get top 10 students (public endpoint)
router.get('/top10/:session?', async (req, res) => {
  try {
    const session = req.params.session || '2026-2027';
    let query = { isPublished: true, session: session };
    const count = await Result.countDocuments(query);
    if (count === 0) {
      delete query.session;
    }

    const top10Results = await Result.find(query)
      .sort({ rank: 1, marks: -1 })
      .limit(10)
      .select('name fatherName rollNumber marks rank subject phone status percentage grade school')
      .lean();

    res.json({
      success: true,
      data: top10Results,
      count: top10Results.length
    });
  } catch (error) {
    console.error('Error fetching top 10 results:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create/Update result (admin only)
router.post('/create', async (req, res) => {
  try {
    const resultData = req.body;
    
    // Validate required fields
    const requiredFields = ['rollNumber', 'name', 'fatherName', 'subject', 'marks', 'rank', 'examDate'];
    for (const field of requiredFields) {
      if (!resultData[field]) {
        return res.status(400).json({ 
          success: false, 
          message: `${field} is required` 
        });
      }
    }

    // Check if result already exists
    const existingResult = await Result.findOne({ 
      rollNumber: resultData.rollNumber.toUpperCase().trim() 
    });

    if (existingResult) {
      // Update existing result
      const updatedResult = await Result.findByIdAndUpdate(
        existingResult._id,
        { ...resultData, rollNumber: resultData.rollNumber.toUpperCase().trim() },
        { new: true, runValidators: true }
      );

      return res.json({
        success: true,
        data: updatedResult,
        message: 'Result updated successfully'
      });
    } else {
      // Create new result
      const newResult = new Result({
        ...resultData,
        rollNumber: resultData.rollNumber.toUpperCase().trim()
      });

      await newResult.save();

      res.status(201).json({
        success: true,
        data: newResult,
        message: 'Result created successfully'
      });
    }

  } catch (error) {
    console.error('Error creating/updating result:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Bulk create results (admin only)
router.post('/bulk-create', async (req, res) => {
  try {
    const { results } = req.body;
    
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Results array is required' 
      });
    }

    const createdResults = [];
    const errors = [];

    for (let i = 0; i < results.length; i++) {
      try {
        const resultData = results[i];
        resultData.rollNumber = resultData.rollNumber.toUpperCase().trim();

        // Check if result already exists
        const existingResult = await Result.findOne({ 
          rollNumber: resultData.rollNumber 
        });

        if (existingResult) {
          // Update existing
          const updatedResult = await Result.findByIdAndUpdate(
            existingResult._id,
            resultData,
            { new: true, runValidators: true }
          );
          createdResults.push(updatedResult);
        } else {
          // Create new
          const newResult = new Result(resultData);
          await newResult.save();
          createdResults.push(newResult);
        }
      } catch (error) {
        errors.push({
          index: i,
          rollNumber: results[i].rollNumber,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: createdResults,
      created: createdResults.length,
      errors: errors,
      message: `Successfully processed ${createdResults.length} results`
    });

  } catch (error) {
    console.error('Error bulk creating results:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Publish results (admin only)
router.patch('/publish', async (req, res) => {
  try {
    const { rollNumbers, publishAll } = req.body;

    let updateQuery = {};
    
    if (publishAll) {
      updateQuery = { isPublished: true, publishedAt: new Date() };
    } else if (rollNumbers && Array.isArray(rollNumbers)) {
      updateQuery = { 
        rollNumber: { $in: rollNumbers.map(rn => rn.toUpperCase().trim()) },
        isPublished: true, 
        publishedAt: new Date() 
      };
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Either publishAll=true or rollNumbers array is required' 
      });
    }

    const result = await Result.updateMany(
      publishAll ? {} : { rollNumber: { $in: rollNumbers.map(rn => rn.toUpperCase().trim()) } },
      updateQuery
    );

    res.json({
      success: true,
      message: `Successfully published ${result.modifiedCount} results`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error publishing results:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Delete result (admin only)
router.delete('/:rollNumber', async (req, res) => {
  try {
    const { rollNumber } = req.params;
    
    const result = await Result.findOneAndDelete({ 
      rollNumber: rollNumber.toUpperCase().trim() 
    });

    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Result not found' 
      });
    }

    res.json({
      success: true,
      message: 'Result deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get result statistics (admin only)
router.get('/stats', async (req, res) => {
  try {
    const stats = await Result.aggregate([
      {
        $group: {
          _id: '$subject',
          totalStudents: { $sum: 1 },
          averageMarks: { $avg: '$marks' },
          highestMarks: { $max: '$marks' },
          lowestMarks: { $min: '$marks' },
          passedStudents: {
            $sum: { $cond: [{ $eq: ['$status', 'Passed'] }, 1, 0] }
          }
        }
      }
    ]);

    const totalResults = await Result.countDocuments();
    const publishedResults = await Result.countDocuments({ isPublished: true });

    res.json({
      success: true,
      data: {
        totalResults,
        publishedResults,
        unpublishedResults: totalResults - publishedResults,
        subjectStats: stats
      }
    });

  } catch (error) {
    console.error('Error fetching result statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;
