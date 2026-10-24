const xlsx = require('xlsx');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Result = require('./models/Result');
const CompetitionApplication = require('./models/CompetitionApplication');

const EXCEL_PATH = path.resolve(__dirname, '../../STUDENT RESULTS KUMAR NIICT.xlsx');

async function importResults() {
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
  console.log('✅ Connected to MongoDB');

  // Load applications for enrichment
  console.log('📦 Loading CompetitionApplication records...');
  const allApps = await CompetitionApplication.find().lean();
  console.log(`Loaded ${allApps.length} competition applications from database.`);

  // Build lookup indexes
  const appByRoll = new Map();
  const appByNum = new Map();
  const appByNameFather = new Map();
  const appByName = new Map();

  for (const app of allApps) {
    const rawRoll = (app.rollNumber || '').trim().toUpperCase();
    if (rawRoll) {
      appByRoll.set(rawRoll, app);
      const numMatch = rawRoll.match(/\d+/);
      if (numMatch) {
        appByNum.set(numMatch[0], app);
      }
    }
    const normName = (app.name || '').trim().toUpperCase().replace(/\s+/g, ' ');
    const normFather = (app.fatherName || '').trim().toUpperCase().replace(/\s+/g, ' ');
    if (normName && normFather) {
      appByNameFather.set(`${normName}|${normFather}`, app);
    }
    if (normName && !appByName.has(normName)) {
      appByName.set(normName, app);
    }
  }

  // Known manual corrections from Excel typos to accurate Application records
  const MANUAL_CORRECTIONS = {
    // Row 221: SHUBHAM KUMAR, Father: SAHAB LAL in excel was 1532 -> actual NIICT1523
    'SHUBHAM KUMAR|SAHAB LAL': 'NIICT1523',
    // Row 256: HARSH MISHRA, Father: SANJAY MISHRA in excel was 1759 -> actual NIICT1752
    'HARSH MISHRA|SANJAY MISHRA': 'NIICT1752',
    // Row 305: KHUSHI PANDEY, Father: RAJ KUMAR PANDEY in excel was 1766 -> actual NIICT1760
    'KHUSHI PANDEY|RAJ KUMAR PANDEY': 'NIICT1760',
    // Row 319: NANDANI, Father: SAHAB LAL in excel was 1527 -> actual NIICT1521
    'NANDANI|SAHAB LAL': 'NIICT1521',
    // Row 239: ROSHANI YADAV, Father: SANJAY KUMAR YADAV in excel was 1789 -> actual NIICT1782
    'ROSHANI YADAV|SANJAY KUMAR YADAV': 'NIICT1782',
    // Row 2: ALOK GUPTA, Father: MUKESH GUPTA in excel was 1540 (NA marks)
    'ALOK GUPTA|MUKESH GUPTA': 'NIICT1540',
    // Row 1: RAHUL KUMAR, Father: RAJKUMAR (NA roll, NA marks)
    'RAHUL KUMAR|RAJKUMAR': 'NIICT1516',
  };

  // Read Excel
  console.log(`📄 Reading Excel file from: ${EXCEL_PATH}`);
  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheet = workbook.Sheets['Sheet1'] || workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`Total rows in sheet: ${rawRows.length}`);

  const studentList = [];

  // Rows 2 to 396 contain students
  for (let i = 2; i <= 396; i++) {
    const row = rawRows[i];
    if (!row || !row[0]) continue;

    const srNo = Number(row[0]);
    const rawName = String(row[1] || '').trim();
    const rawFather = String(row[2] || '').trim();
    const rawRoll = String(row[3] || '').trim();
    const rawMarks = row[4];

    if (!rawName) continue;

    const cleanName = rawName.toUpperCase().replace(/\s+/g, ' ');
    const cleanFather = rawFather.toUpperCase().replace(/\s+/g, ' ');
    const nameFatherKey = `${cleanName}|${cleanFather}`;

    let isAbsent = false;
    let numericMarks = 0;

    if (rawMarks === 'NA' || rawMarks === undefined || rawMarks === null || isNaN(parseFloat(rawMarks))) {
      isAbsent = true;
      numericMarks = 0;
    } else {
      numericMarks = parseFloat(rawMarks);
    }

    // Determine target roll number
    let targetRoll = null;
    let numericRoll = null;

    if (MANUAL_CORRECTIONS[nameFatherKey]) {
      targetRoll = MANUAL_CORRECTIONS[nameFatherKey];
      const m = targetRoll.match(/\d+/);
      numericRoll = m ? m[0] : targetRoll;
    } else {
      const match = rawRoll.match(/\d+/);
      if (match) {
        numericRoll = match[0];
        targetRoll = `NIICT${numericRoll}`;
      } else if (rawRoll !== 'NA' && rawRoll) {
        targetRoll = rawRoll.toUpperCase();
        numericRoll = rawRoll.replace(/\D/g, '');
      } else {
        // Fallback for Rahul Kumar or missing roll
        targetRoll = `NIICT${String(srNo).padStart(4, '0')}`;
        numericRoll = String(srNo);
      }
    }

    // Find matched application
    let matchedApp = null;
    if (targetRoll && appByRoll.has(targetRoll)) {
      matchedApp = appByRoll.get(targetRoll);
    } else if (numericRoll && appByNum.has(numericRoll)) {
      matchedApp = appByNum.get(numericRoll);
    } else if (appByNameFather.has(nameFatherKey)) {
      matchedApp = appByNameFather.get(nameFatherKey);
    } else if (appByName.has(cleanName)) {
      matchedApp = appByName.get(cleanName);
    }

    // Format DOB if available
    let dobDate = matchedApp?.dateOfBirth ? new Date(matchedApp.dateOfBirth) : null;
    let dobFormatted = '';
    if (dobDate && !isNaN(dobDate.getTime())) {
      const d = String(dobDate.getUTCDate()).padStart(2, '0');
      const m = String(dobDate.getUTCMonth() + 1).padStart(2, '0');
      const y = dobDate.getUTCFullYear();
      dobFormatted = `${d}-${m}-${y}`;
    }

    studentList.push({
      srNo,
      name: cleanName,
      fatherName: cleanFather,
      motherName: matchedApp?.motherName || '',
      phone: matchedApp?.phone || matchedApp?.parentPhone || '',
      aadhaar: matchedApp?.aadhaar || '',
      dob: dobDate,
      dobFormatted: dobFormatted,
      school: matchedApp?.school || '',
      class: matchedApp?.classPassed || '',
      address: matchedApp?.address || '',
      rollNumber: targetRoll,
      numericRoll: numericRoll,
      marks: numericMarks,
      isAbsent: isAbsent,
      status: isAbsent ? 'Absent' : (numericMarks >= 33 ? 'Passed' : 'Needs Improvement'),
      session: '2026-2027',
      subject: 'GK & Talent Search',
      examDate: new Date('2026-10-18'),
    });
  }

  console.log(`Extracted ${studentList.length} total students.`);

  // Calculate ranks
  // Sort students with marks descending; Absent students at the end
  const scoredStudents = studentList.filter(s => !s.isAbsent);
  const absentStudents = studentList.filter(s => s.isAbsent);

  scoredStudents.sort((a, b) => b.marks - a.marks);

  let currentRank = 1;
  for (let i = 0; i < scoredStudents.length; i++) {
    if (i > 0) {
      if (scoredStudents[i].marks < scoredStudents[i - 1].marks) {
        currentRank = i + 1; // standard competition rank (1, 2, 3, 3, 5...)
      }
    }
    scoredStudents[i].rank = currentRank;
  }

  // Absent students get rank at the end
  const absentRank = scoredStudents.length + 1;
  absentStudents.forEach(s => {
    s.rank = absentRank;
  });

  const finalResults = [...scoredStudents, ...absentStudents];

  console.log('\n🏆 Top 10 Performers Preview:');
  finalResults.slice(0, 10).forEach(s => {
    console.log(`Rank #${s.rank}: ${s.name} (Roll: ${s.rollNumber}) - Marks: ${s.marks} - Father: ${s.fatherName} - Mobile: ${s.phone || 'N/A'}`);
  });

  // Save to MongoDB
  console.log(`\n💾 Upserting ${finalResults.length} results into MongoDB...`);

  let insertedCount = 0;
  let updatedCount = 0;

  for (const s of finalResults) {
    const percentage = s.isAbsent ? 0 : Math.round(Math.max(0, s.marks));
    let grade = 'F';
    if (s.isAbsent) grade = 'AB';
    else if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C+';
    else if (percentage >= 40) grade = 'C';
    else if (percentage >= 33) grade = 'D';

    const updateDoc = {
      rollNumber: s.rollNumber,
      numericRoll: s.numericRoll,
      name: s.name,
      fatherName: s.fatherName,
      motherName: s.motherName,
      phone: s.phone,
      aadhaar: s.aadhaar,
      dob: s.dob,
      dobFormatted: s.dobFormatted,
      school: s.school,
      class: s.class,
      address: s.address,
      subject: s.subject,
      marks: s.marks,
      totalMarks: 100,
      percentage: percentage,
      rank: s.rank,
      grade: grade,
      status: s.status,
      session: s.session,
      examDate: s.examDate,
      isPublished: true,
      publishedAt: new Date(),
      createdBy: 'admin'
    };

    const existing = await Result.findOne({ rollNumber: s.rollNumber });
    if (existing) {
      await Result.findByIdAndUpdate(existing._id, updateDoc);
      updatedCount++;
    } else {
      const newRes = new Result(updateDoc);
      await newRes.save();
      insertedCount++;
    }
  }

  console.log(`\n🎉 Import Complete!`);
  console.log(`- Inserted new results: ${insertedCount}`);
  console.log(`- Updated results: ${updatedCount}`);
  console.log(`- Total 2026-2027 results in DB: ${await Result.countDocuments({ session: '2026-2027' })}`);
  console.log(`- Total published results in DB: ${await Result.countDocuments({ isPublished: true })}`);

  await mongoose.disconnect();
  console.log('✅ MongoDB disconnected cleanly.');
}

importResults().catch(err => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
