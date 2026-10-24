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
    numericRoll: {
      type: String,
      trim: true,
      index: true
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
      default: 'GK'
    },
    marks: { 
      type: Number, 
      required: true,
      min: -100,
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
    session: {
      type: String,
      default: '2026-2027',
      index: true
    },
    status: { 
      type: String, 
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
      trim: true,
      index: true
    },
    aadhaar: {
      type: String,
      required: false,
      trim: true,
      index: true
    },
    dob: {
      type: Date,
      required: false
    },
    dobFormatted: {
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
      type: Number
    },
    grade: { 
      type: String
    },
    remarks: { 
      type: String,
      trim: true
    },
    // Metadata
    isPublished: { 
      type: Boolean, 
      default: true 
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
  if (this.marks === null || this.marks === undefined || isNaN(this.marks)) return 0;
  return Math.round((Math.max(0, this.marks) / (this.totalMarks || 100)) * 100);
});

// Virtual for grade calculation
ResultSchema.virtual('calculatedGrade').get(function() {
  const percentage = this.calculatedPercentage;
  if (this.status === 'Absent') return 'AB';
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
  if (this.rollNumber && !this.numericRoll) {
    const m = this.rollNumber.match(/\d+/);
    if (m) this.numericRoll = m[0];
  }
  next();
});

// Index for faster searches
ResultSchema.index({ rollNumber: 1 });
ResultSchema.index({ numericRoll: 1 });
ResultSchema.index({ phone: 1 });
ResultSchema.index({ aadhaar: 1 });
ResultSchema.index({ subject: 1 });
ResultSchema.index({ rank: 1 });
ResultSchema.index({ session: 1 });
ResultSchema.index({ isPublished: 1 });

module.exports = mongoose.model('Result', ResultSchema);
