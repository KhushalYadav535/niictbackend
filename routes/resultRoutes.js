const express = require('express');
const router = express.Router();
const Result = require('../models/Result');

// Get result by roll number (public endpoint)
router.get('/search/:rollNumber', async (req, res) => {
  try {
    const { rollNumber } = req.params;
    
    if (!rollNumber || rollNumber.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Roll number is required' 
      });
    }

    // Check if results are published
    let searchRollNumber = rollNumber.toUpperCase().trim();
    
    // Convert GK to SK since all results are now SK
    if (searchRollNumber.startsWith('GK')) {
      searchRollNumber = 'SK' + searchRollNumber.substring(2);
    } else if (!searchRollNumber.startsWith('SK')) {
      // If no prefix, add SK prefix
      searchRollNumber = 'SK' + searchRollNumber;
    }
    
    const publishedResults = await Result.findOne({ 
      rollNumber: searchRollNumber,
      isPublished: true 
    });

    if (!publishedResults) {
      // Check if any results are published at all
      const anyPublishedResults = await Result.findOne({ isPublished: true });
      
      if (!anyPublishedResults) {
        return res.status(404).json({ 
          success: false, 
          message: 'Results will be announced on 18th October at 12:00 PM. Please check back later.',
          isPublished: false
        });
      } else {
        return res.status(404).json({ 
          success: false, 
          message: `No result found for roll number ${searchRollNumber}. Please check your roll number and try again.`,
          isPublished: true
        });
      }
    }

    res.json({
      success: true,
      data: publishedResults,
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
    
    if (!['GK', 'Computer', 'Both'].includes(subject)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid subject. Must be GK, Computer, or Both' 
      });
    }

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
      .sort({ rank: 1 })
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

// Get top 3 students by subject (public endpoint for result display)
router.get('/top3/:subject?', async (req, res) => {
  try {
    const { subject } = req.params;
    
    // Default to Computer subject if no subject specified
    const targetSubject = subject && ['GK', 'Computer', 'Both'].includes(subject) ? subject : 'Computer';
    
    let query = { isPublished: true };
    if (targetSubject !== 'Both') {
      query.subject = targetSubject;
    }
    
    const top3Results = await Result.find(query)
      .sort({ rank: 1 })
      .limit(3)
      .select('name fatherName rollNumber marks rank subject')
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
