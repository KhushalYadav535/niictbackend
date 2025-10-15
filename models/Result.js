const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema(
  {
    rollNumber: { 
      type: String, 
      required: true, 
      unique: true,
      uppercase: true,
      trim: true
    },
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    fatherName: { 
      type: String, 
      required: true,
      trim: true
    },
    motherName: { 
      type: String, 
      required: false,
      trim: true
    },
    subject: { 
      type: String, 
      required: true,
      enum: ['GK', 'Computer', 'Both'],
      default: 'GK'
    },
    marks: { 
      type: Number, 
      required: true,
      min: 0,
      max: 100
    },
    rank: { 
      type: Number, 
      required: true,
      min: 1
    },
    examDate: { 
      type: Date, 
      required: true
    },
    status: { 
      type: String, 
      enum: ['Passed', 'Failed'], 
      default: 'Passed'
    },
    class: { 
      type: String, 
      required: false,
      trim: true
    },
    school: { 
      type: String, 
      required: false,
      trim: true
    },
    phone: { 
      type: String, 
      required: false,
      trim: true
    },
    address: { 
      type: String, 
      required: false,
      trim: true
    },
    // Additional fields for result display
    totalMarks: { 
      type: Number, 
      default: 100
    },
    percentage: { 
      type: Number,
      min: 0,
      max: 100
    },
    grade: { 
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
    },
    remarks: { 
      type: String,
      trim: true
    },
    // Metadata
    isPublished: { 
      type: Boolean, 
      default: false 
    },
    publishedAt: { 
      type: Date 
    },
    createdBy: { 
      type: String,
      default: 'admin'
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for percentage calculation
ResultSchema.virtual('calculatedPercentage').get(function() {
  return Math.round((this.marks / this.totalMarks) * 100);
});

// Virtual for grade calculation
ResultSchema.virtual('calculatedGrade').get(function() {
  const percentage = this.calculatedPercentage;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 33) return 'D';
  return 'F';
});

// Pre-save middleware to calculate percentage and grade
ResultSchema.pre('save', function(next) {
  if (this.isModified('marks') || this.isModified('totalMarks')) {
    this.percentage = this.calculatedPercentage;
    this.grade = this.calculatedGrade;
  }
  next();
});

// Index for faster searches
ResultSchema.index({ rollNumber: 1 });
ResultSchema.index({ subject: 1 });
ResultSchema.index({ rank: 1 });
ResultSchema.index({ isPublished: 1 });

module.exports = mongoose.model('Result', ResultSchema);
