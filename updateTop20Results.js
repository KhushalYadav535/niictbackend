const xlsx = require('xlsx');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Result = require('./models/Result');

const EXCEL_PATH = path.resolve(__dirname, '../../top 20 excel file.xlsx');

async function updateTop20() {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    throw new Error('MONGODB_URI not found in environment!');
  }

  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  console.log('✅ Connected to MongoDB\n');

  console.log(`📄 Reading Sheet2 from: ${EXCEL_PATH}`);
  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheet2 = workbook.Sheets['Sheet2'];
  if (!sheet2) {
    throw new Error('Sheet2 not found in Excel file!');
  }

  const rawRows = xlsx.utils.sheet_to_json(sheet2, { header: 1 });
  console.log(`Found ${rawRows.length} rows in Sheet2.\n`);

  // Parse the 20 students from Sheet2
  const top20Students = [];
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length < 5) continue;

    const rank = Number(row[0]);
    const name = String(row[1] || '').trim();
    const fatherName = String(row[2] || '').trim();
    const rawRoll = String(row[3] || '').trim();
    const marks = Number(row[4]);

    if (!name || isNaN(rank) || isNaN(marks)) continue;

    const numMatch = rawRoll.match(/\d+/);
    const numericRoll = numMatch ? numMatch[0] : rawRoll;
    const standardRoll = `NIICT${numericRoll}`;

    top20Students.push({
      rank,
      name,
      fatherName,
      rawRoll,
      numericRoll,
      standardRoll,
      marks
    });
  }

  console.log(`Parsed ${top20Students.length} Top 20 students from Sheet2:\n`);
  top20Students.forEach(s => {
    console.log(`  Rank ${s.rank.toString().padStart(2, ' ')}: ${s.name.padEnd(25, ' ')} | Father: ${s.fatherName.padEnd(25, ' ')} | Roll: ${s.standardRoll} | Marks: ${s.marks}`);
  });

  const top20Rolls = new Set();
  const top20NumericRolls = new Set();
  top20Students.forEach(s => {
    top20Rolls.add(s.standardRoll);
    top20Rolls.add(s.rawRoll);
    top20NumericRolls.add(s.numericRoll);
  });

  console.log('\n🚀 Step 1: Updating Top 20 students in MongoDB...');
  let updatedTop20Count = 0;
  const updateReport = [];

  for (const s of top20Students) {
    // Find student in DB
    const query = {
      session: '2026-2027',
      $or: [
        { rollNumber: s.standardRoll },
        { rollNumber: s.rawRoll },
        { numericRoll: s.numericRoll }
      ]
    };

    const existing = await Result.findOne(query);
    if (!existing) {
      console.warn(`⚠️ Warning: Could not find DB record for ${s.name} (${s.standardRoll})`);
      continue;
    }

    const percentage = Math.round(Math.max(0, s.marks));
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C+';
    else if (percentage >= 40) grade = 'C';
    else if (percentage >= 33) grade = 'D';

    const oldMarks = existing.marks;
    const oldRank = existing.rank;

    existing.marks = s.marks;
    existing.rank = s.rank;
    existing.percentage = percentage;
    existing.grade = grade;
    existing.status = s.marks >= 33 ? 'Passed' : 'Needs Improvement';
    existing.isPublished = true;

    await existing.save();
    updatedTop20Count++;

    updateReport.push({
      roll: existing.rollNumber,
      name: existing.name,
      oldMarks,
      newMarks: s.marks,
      oldRank,
      newRank: s.rank,
      grade
    });
  }

  console.log(`✅ Successfully updated ${updatedTop20Count} Top 20 records.\n`);

  console.log('🚀 Step 2: Setting rank = null for all non-top-20 students in session 2026-2027...');
  // All 2026-2027 students not in top20
  const nonTop20Result = await Result.updateMany(
    {
      session: '2026-2027',
      rollNumber: { $nin: Array.from(top20Rolls) },
      numericRoll: { $nin: Array.from(top20NumericRolls) }
    },
    {
      $set: { rank: null }
    }
  );

  console.log(`✅ Successfully cleared ranks for ${nonTop20Result.modifiedCount} non-top-20 students (rank set to null).\n`);

  console.log('🔍 Step 3: Verification Check from MongoDB:');
  const verifyTop20 = await Result.find({
    session: '2026-2027',
    rank: { $ne: null }
  }).sort({ rank: 1 }).lean();

  console.log(`Found ${verifyTop20.length} students with active Rank in session 2026-2027:`);
  console.log('='.repeat(95));
  console.log(`| ${'Rank'.padEnd(5)} | ${'Roll Number'.padEnd(12)} | ${'Student Name'.padEnd(25)} | ${'Marks'.padEnd(8)} | ${'Grade'.padEnd(6)} | Status |`);
  console.log('='.repeat(95));
  verifyTop20.forEach(r => {
    console.log(`| #${r.rank.toString().padEnd(4)} | ${r.rollNumber.padEnd(12)} | ${r.name.padEnd(25)} | ${r.marks.toString().padEnd(8)} | ${r.grade.padEnd(6)} | ${r.status} |`);
  });
  console.log('='.repeat(95));

  const unrankedCount = await Result.countDocuments({
    session: '2026-2027',
    rank: null
  });
  console.log(`\n📊 Total session 2026-2027 candidates without rank: ${unrankedCount}`);
  console.log(`📊 Total session 2026-2027 candidates with rank (1-20): ${verifyTop20.length}`);

  await mongoose.disconnect();
  console.log('\n✅ Database disconnected cleanly. All updates completed successfully!');
}

updateTop20().catch(err => {
  console.error('❌ Update failed:', err);
  process.exit(1);
});
