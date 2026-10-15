const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

function cleanSchoolForGrouping(name) {
  if (!name || name.trim() === '' || name.trim().toUpperCase() === 'NA') return 'NA / INDEPENDENT';
  let s = name.trim().toUpperCase().replace(/\s+/g, ' ');
  if (s.includes('DHYEYA') || s.includes('DHEYA')) return 'DHYEYA STUDY';
  if (s.includes('TOP 10')) return 'TOP 10 CLASSES';
  if (s.includes('NDC')) return 'NDC COACHING/INSTITUTE';
  if (s.includes('VIJAY')) return 'VIJAY COACHING';
  if (s.includes('NIC JANGHAI') || s.includes('N.I.C JANGHAI') || s.includes('NIC')) return 'NIC JANGHAI';
  if (s.includes('NIICT')) return 'NIICT COMPUTER';
  if (s.includes('KDS') || s.includes('K.D.S')) return 'KDS SCHOOL';
  if (s.includes('SACHIN COACHING')) return 'SACHIN COACHING';
  if (s.includes('KRISHNA COACHING')) return 'KRISHNA COACHING';
  if (s.includes('GYANDEEP') || s.includes('GYAN DEEP')) return 'GYANDEEP COACHING';
  if (s.includes('LAKSHYA')) return 'LAKSHYA COACHING';
  if (s.includes('SARVODAYA') || s.includes('SARVODYA')) return 'SARVODAYA VIDYAPEETH';
  if (s.includes('RD MEMORIAL') || s.includes('R.D MEMORIAL') || s.includes('R D MEMORIAL')) return 'RD MEMORIAL IC';
  if (s.includes('NAGRIK') || s.includes('NAGARIK')) return 'NAGRIK DEGREE COLLEGE';
  return s;
}

function formatCleanSchool(raw) {
  if (!raw || raw.trim() === '' || raw.trim().toUpperCase() === 'NA') {
    return 'INDEPENDENT / NA';
  }
  let s = raw.trim().replace(/\s+/g, ' ');
  const upper = s.toUpperCase();

  if (upper.includes('DHYEYA') || upper.includes('DHEYA')) return 'DHYEYA STUDY';
  if (upper.includes('TOP 10')) return 'TOP 10 CLASSES';
  if (upper.includes('NDC')) return 'NDC COACHING';
  if (upper.includes('VIJAY')) return 'VIJAY COACHING';
  if (upper.includes('NIC JANGHAI') || upper.includes('N.I.C JANGHAI') || upper.includes('NIC')) return 'NIC JANGHAI';
  if (upper.includes('NIICT')) return 'NIICT COMPUTER';
  if (upper.includes('KDS') || upper.includes('K.D.S')) return 'KDS SCHOOL';
  if (upper.includes('SACHIN')) return 'SACHIN COACHING';
  if (upper.includes('KRISHNA')) return 'KRISHNA COACHING';
  if (upper.includes('GYANDEEP') || upper.includes('GYAN DEEP')) return 'GYANDEEP COACHING';
  if (upper.includes('LAKSHYA')) return 'LAKSHYA COACHING';
  if (upper.includes('SARVODAYA') || upper.includes('SARVODYA')) return 'SARVODAYA IC';
  if (upper.includes('RD MEMORIAL') || upper.includes('R.D MEMORIAL') || upper.includes('R D MEMORIAL')) return 'RD MEMORIAL IC';
  if (upper.includes('NAGRIK') || upper.includes('NAGARIK')) return 'NAGRIK DEGREE COLLEGE';
  if (upper.includes('DASAVANITI')) return 'DASAVANITI DEVI MV';
  if (upper.includes('SHREE DEVI') || upper.includes('SRI DEVI')) return 'SHREE DEVI PRASAD MV';
  if (upper.includes('SPEAK WELL')) return 'SPEAK WELL ACADEMY';
  if (upper.includes('MATA PITA')) return 'MATA PITA IC';
  if (upper.includes('SITA DEVI')) return 'SITA DEVI IC';
  if (upper.includes('SDPG') || upper.includes('S D P G')) return 'SDPG COLLEGE';
  if (upper.includes('SUBHASH')) return 'SUBHASH IC';
  if (upper.includes('SIC GARIYAW')) return 'SIC GARIYAW';
  if (upper.includes('SICSM')) return 'SICSM INSTITUTE';
  if (upper.includes('DIVINE')) return 'DIVINE COACHING';
  if (upper.includes('NAVDISHA') || upper.includes('NAV DISHA')) return 'NAV DISHA COACHING';
  if (upper.includes('SMART COACHING')) return 'SMART COACHING';

  s = s.replace(/Mahavidyalay[a-z]*/gi, 'MV');
  s = s.replace(/INTERMIDIAT COLLEGE|Intermediate college|Intermediate College|Inter college|Inter College/gi, 'IC');
  s = s.replace(/Degree College/gi, 'DC');
  s = s.replace(/Coaching center|Coaching Center|Coaching classes|Coaching Classes|Coaching Clasess/gi, 'Coaching');
  s = s.replace(/English medium school|English Medium School/gi, 'EMS');
  s = s.replace(/Convent school|Convent School/gi, 'Convent');
  s = s.replace(/Public school|Public School/gi, 'PS');
  s = s.replace(/Academy/gi, 'Acad.');
  s = s.replace(/Prayagraj|Jaunpur|Janghai/gi, '').trim();

  if (s.length > 20) {
    s = s.slice(0, 19) + '…';
  }
  return s.toUpperCase();
}

function solveBenchRoom(students, benchRows = 5, benchCols = 4) {
  const grid = Array.from({ length: benchRows }, () =>
    Array.from({ length: benchCols }, () => ({ L: null, R: null }))
  );

  const schoolGroups = {};
  for (const s of students) {
    const sc = s.schoolClean;
    if (!schoolGroups[sc]) schoolGroups[sc] = [];
    schoolGroups[sc].push(s);
  }

  const sortedSchools = Object.keys(schoolGroups).sort((a, b) => {
    if (a === 'NA / INDEPENDENT') return 1;
    if (b === 'NA / INDEPENDENT') return -1;
    return schoolGroups[b].length - schoolGroups[a].length;
  });

  const orderedStudents = [];
  for (const sc of sortedSchools) {
    orderedStudents.push(...schoolGroups[sc]);
  }

  const allSlots = [];
  for (let r = 0; r < benchRows; r++) {
    for (let c = 0; c < benchCols; c++) {
      allSlots.push({ r, c, side: 'L' });
      allSlots.push({ r, c, side: 'R' });
    }
  }

  allSlots.sort((a, b) => {
    const parityA = (a.r + a.c) % 2;
    const parityB = (b.r + b.c) % 2;
    if (parityA !== parityB) return parityA - parityB;
    return a.side.localeCompare(b.side);
  });

  function isSafe(r, c, side, school) {
    if (school === 'NA / INDEPENDENT') return true;

    const otherSide = side === 'L' ? 'R' : 'L';

    if (grid[r][c][otherSide] && grid[r][c][otherSide].schoolClean === school) {
      return false;
    }

    if (r > 0) {
      if (grid[r - 1][c][side] && grid[r - 1][c][side].schoolClean === school) {
        return false;
      }
    }

    if (r < benchRows - 1) {
      if (grid[r + 1][c][side] && grid[r + 1][c][side].schoolClean === school) {
        return false;
      }
    }

    if (side === 'L' && c > 0) {
      if (grid[r][c - 1]['R'] && grid[r][c - 1]['R'].schoolClean === school) {
        return false;
      }
    }
    if (side === 'R' && c < benchCols - 1) {
      if (grid[r][c + 1]['L'] && grid[r][c + 1]['L'].schoolClean === school) {
        return false;
      }
    }

    return true;
  }

  function backtrack(studentIdx) {
    if (studentIdx === orderedStudents.length) return true;
    const student = orderedStudents[studentIdx];
    const school = student.schoolClean;

    for (const slot of allSlots) {
      if (grid[slot.r][slot.c][slot.side] === null) {
        if (isSafe(slot.r, slot.c, slot.side, school)) {
          grid[slot.r][slot.c][slot.side] = student;
          const benchNo = slot.r * benchCols + slot.c + 1;
          student.benchNo = benchNo;
          student.benchRow = slot.r + 1;
          student.benchCol = slot.c + 1;
          student.side = slot.side;
          student.seatSide = slot.side === 'L' ? 'Seat 1 (Left)' : 'Seat 2 (Right)';
          student.seatCode = `Bench ${benchNo} (${slot.side === 'L' ? 'Left' : 'Right'})`;

          if (backtrack(studentIdx + 1)) return true;

          grid[slot.r][slot.c][slot.side] = null;
          delete student.benchNo;
          delete student.benchRow;
          delete student.benchCol;
          delete student.side;
          delete student.seatSide;
          delete student.seatCode;
        }
      }
    }
    return false;
  }

  const success = backtrack(0);
  return { success, grid };
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const CompetitionApplication = mongoose.model('CompetitionApplication', require('./models/CompetitionApplication').schema);

  const docs = await CompetitionApplication.find({ session: '2026-2027' }).sort({ rollNumber: 1 }).lean();
  console.log(`Loaded ${docs.length} applications.`);

  const chunkSize = 40;
  const rooms = [];

  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    const roomNum = Math.floor(i / chunkSize) + 1;

    const students = chunk.map(d => ({
      rollNumber: d.rollNumber,
      name: d.name ? d.name.trim() : 'Unknown',
      fatherName: d.fatherName ? d.fatherName.trim() : '',
      motherName: d.motherName ? d.motherName.trim() : '',
      phone: d.phone || '',
      school: d.school ? d.school.trim() : 'NA',
      schoolClean: cleanSchoolForGrouping(d.school),
      schoolDisplay: formatCleanSchool(d.school),
      subject: d.subject || 'GK',
      classPassed: d.classPassed || ''
    }));

    const benchRows = 5;
    const benchCols = 4;
    const { success, grid } = solveBenchRoom(students, benchRows, benchCols);

    if (!success) {
      console.error(`Room ${roomNum} solver failed!`);
      continue;
    }

    const attendanceList = [...students].sort((a, b) =>
      a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true })
    );

    // Build flat list of all 40 cards ordered bench-wise:
    // Bench 1 Left, Bench 1 Right, Bench 2 Left, Bench 2 Right, etc.
    const allCards = [];
    for (let r = 0; r < benchRows; r++) {
      for (let c = 0; c < benchCols; c++) {
        const benchNo = r * benchCols + c + 1;
        const b = grid[r][c];
        if (b.L) allCards.push({ ...b.L, benchNo, seatLabel: 'SEAT 1 (LEFT)', rowPos: `Row ${r + 1}, Col ${c + 1}`, sideType: 'L' });
        if (b.R) allCards.push({ ...b.R, benchNo, seatLabel: 'SEAT 2 (RIGHT)', rowPos: `Row ${r + 1}, Col ${c + 1}`, sideType: 'R' });
      }
    }

    rooms.push({
      roomNumber: roomNum,
      studentCount: students.length,
      benchCount: Math.ceil(students.length / 2),
      rollRange: `${attendanceList[0].rollNumber} to ${attendanceList[attendanceList.length - 1].rollNumber}`,
      grid,
      benchRows,
      benchCols,
      allCards,
      attendanceList
    });
  }

  // Generate HTML with TRUE WIDE HORIZONTAL CARDS (1 Card = 1 Student, styled exactly like Image 2)
  let html = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>NIICT 2026-2027 Exam Bench Seating (Horizontal Cards - 1 Card Per Student)</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      padding: 16px;
      line-height: 1.25;
    }

    /* Screen UI Controls */
    .top-controls {
      background: white;
      padding: 14px 20px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.06);
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .main-title {
      font-size: 17px;
      font-weight: 800;
      color: #1e3a8a;
    }
    .main-sub {
      font-size: 11.5px;
      color: #64748b;
    }
    .print-actions {
      display: flex;
      gap: 10px;
    }
    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .btn-primary {
      background: #1e3a8a;
      color: white;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-secondary {
      background: #0f172a;
      color: white;
    }
    .btn-secondary:hover {
      background: #334155;
    }

    /* Room Selector Tabs */
    .tabs {
      display: flex;
      gap: 6px;
      margin-bottom: 14px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .tab-btn {
      background: white;
      border: 1px solid #cbd5e1;
      padding: 7px 13px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      color: #334155;
      white-space: nowrap;
      transition: all 0.15s;
    }
    .tab-btn.active, .tab-btn:hover {
      background: #1e3a8a;
      color: white;
      border-color: #1e3a8a;
    }

    /* Page container: sized strictly for A4 */
    .room-page {
      background: white;
      width: 100%;
      max-width: 210mm;
      margin: 0 auto 20px auto;
      padding: 5mm 6mm;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      border-radius: 12px;
      box-sizing: border-box;
      height: 286mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Room Header */
    .header-box {
      border: 2px solid #2563eb;
      border-radius: 8px;
      padding: 5px 12px;
      background: #f8fafc;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .exam-name {
      font-size: 13px;
      font-weight: 900;
      color: #1e3a8a;
      letter-spacing: 0.2px;
      text-transform: uppercase;
    }
    .center-info {
      font-size: 9.5px;
      color: #475569;
      font-weight: 600;
    }
    .room-badge {
      text-align: right;
    }
    .room-num {
      font-size: 16px;
      font-weight: 900;
      color: #1e3a8a;
      line-height: 1.1;
    }
    .room-meta {
      font-size: 9px;
      font-weight: 700;
      color: #2563eb;
    }

    /* Teacher Board Bar */
    .board-bar {
      background: #0f172a;
      color: white;
      text-align: center;
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 1.5px;
      padding: 3px;
      border-radius: 4px;
      margin-bottom: 5px;
      text-transform: uppercase;
    }

    /* 
      WIDE HORIZONTAL CARDS GRID (4 Columns x 10 Rows = 40 Wide Cards):
      Col 1: Bench Left, Col 2: Bench Right
      (Aisle Gap)
      Col 3: Bench Left, Col 4: Bench Right
      Every card has a wide 2:1 horizontal aspect ratio!
    */
    .horizontal-cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      grid-template-rows: repeat(10, 1fr);
      gap: 4px;
      column-gap: 4px;
      flex-grow: 1;
      height: 242mm;
      box-sizing: border-box;
    }

    /* Aisle gap between Left Bench pair (Col 1 & 2) and Right Bench pair (Col 3 & 4) */
    .horizontal-cards-grid > .card-col-2 {
      margin-right: 6px;
    }
    .horizontal-cards-grid > .card-col-3 {
      margin-left: 6px;
    }

    /* INDIVIDUAL HORIZONTAL CARD (Styled Exactly like Image 2) */
    .horiz-card {
      background: #ffffff;
      border: 2px solid #2563eb; /* Vibrant royal blue rounded border like Image 2 */
      border-radius: 9px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(37, 99, 235, 0.08);
      box-sizing: border-box;
      height: 100%;
    }

    /* Header Bar of Card: Bench # (Left) and Row, Col (Right) */
    .horiz-header {
      background: #f1f5f9;
      border-bottom: 1px solid #cbd5e1;
      padding: 2.5px 7px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      line-height: 1.2;
    }
    .bench-tag {
      font-size: 8.5px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
    .pos-tag {
      font-size: 7.5px;
      font-weight: 700;
      color: #64748b;
    }

    /* Card Content: 1 Single Student */
    .horiz-body {
      padding: 3px 7px 4px 7px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex-grow: 1;
      background: #ffffff;
    }
    
    .seat-sublabel {
      font-size: 7px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 0.5px;
    }

    .roll-line {
      font-size: 12.5px;
      font-weight: 900;
      color: #1e3a8a; /* Deep bold blue roll number like Image 2 */
      letter-spacing: 0.3px;
      line-height: 1.1;
    }

    .name-line {
      font-size: 9.5px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 1px 0;
    }

    .school-pill {
      font-size: 8px;
      font-weight: 800;
      color: #3730a3; /* Indigo text like Image 2 */
      background: #ede9fe; /* Soft lavender background like Image 2 */
      border: 1px solid #c7d2fe;
      border-radius: 4px;
      padding: 1.5px 6px;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-block;
      width: fit-content;
      max-width: 100%;
    }

    .horiz-empty {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 700;
      color: #94a3b8;
    }

    /* Page Footer */
    .page-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 3px;
      margin-top: 3px;
      display: flex;
      justify-content: space-between;
      font-size: 7.5px;
      color: #64748b;
      font-weight: 600;
    }

    /* Print Styles */
    @media print {
      @page {
        size: A4 portrait;
        margin: 5mm 6mm;
      }
      body {
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      .room-page {
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: none !important;
        height: 284mm !important;
        max-height: 284mm !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        overflow: hidden !important;
      }
      body.print-single .room-page:not(.active-print) {
        display: none !important;
      }
      body.print-all .room-page {
        display: flex !important;
      }
    }
  </style>
</head>
<body>

  <!-- Screen-Only Controls Bar -->
  <div class="top-controls no-print">
    <div>
      <div class="main-title">🏛️ NIICT Exam 2026-2027: Horizontal Bench Cards (1 Card = 1 Student)</div>
      <div class="main-sub">Wide Horizontal Design (Image 2 Style) • Har bache ka apna 1 wide card • A4 Print Ready.</div>
    </div>
    <div class="print-actions">
      <button class="btn btn-primary" onclick="printCurrentRoom()">🖨️ Print Active Room (1 Page A4)</button>
      <button class="btn btn-secondary" onclick="printAllRooms()">🖨️ Print All 12 Rooms (12 Pages)</button>
    </div>
  </div>

  <!-- Room Selector Tabs -->
  <div class="tabs no-print">
    ${rooms.map((r, i) => `<button id="tab-${r.roomNumber}" class="tab-btn ${i === 0 ? 'active' : ''}" onclick="showRoom(${r.roomNumber})">Room ${r.roomNumber} (${r.studentCount} bache)</button>`).join('')}
  </div>

  <!-- Rooms Pages (Each Room is an exact A4 Page) -->
  ${rooms.map((r, i) => {
    // Organize 20 benches into 10 rows of 2 benches (4 columns of cards)
    // Row r: Bench A (Left Card, Right Card), Bench B (Left Card, Right Card)
    const rowCards = [];
    for (let benchIdx = 0; benchIdx < 20; benchIdx += 2) {
      const b1 = r.grid.flat()[benchIdx];
      const b2 = r.grid.flat()[benchIdx + 1];
      const b1No = benchIdx + 1;
      const b2No = benchIdx + 2;

      rowCards.push({
        b1No,
        b1L: b1 ? b1.L : null,
        b1R: b1 ? b1.R : null,
        b2No,
        b2L: b2 ? b2.L : null,
        b2R: b2 ? b2.R : null,
        rPos1: `Row ${Math.floor(benchIdx / 4) + 1}, Col ${(benchIdx % 4) + 1}`,
        rPos2: `Row ${Math.floor((benchIdx + 1) / 4) + 1}, Col ${((benchIdx + 1) % 4) + 1}`
      });
    }

    return `
      <div id="room-block-${r.roomNumber}" class="room-page ${i === 0 ? 'active-print' : ''}" style="${i === 0 ? '' : 'display: none;'}">
        
        <!-- Top Header -->
        <div class="header-box">
          <div>
            <div class="exam-name">NIICT ALL INDIA COMPETITION 2026-2027</div>
            <div class="center-info">Center: S K Modern Intermediate College Semari Janghai Jaunpur | Date: 18 Oct 2026</div>
          </div>
          <div class="room-badge">
            <div class="room-num">ROOM #${r.roomNumber}</div>
            <div class="room-meta">Roll: ${r.rollRange} (${r.studentCount} Students)</div>
          </div>
        </div>

        <!-- Blackboard -->
        <div class="board-bar">👨‍🏫 BLACKBOARD / TEACHER DESK (FRONT OF CLASSROOM)</div>

        <!-- 4 Columns of Wide Horizontal Cards (Col 1 & 2: Bench A, Col 3 & 4: Bench B) -->
        <div class="horizontal-cards-grid">
          ${rowCards.map(rc => `
            <!-- Bench 1 Left Card -->
            ${rc.b1L ? `
              <div class="horiz-card">
                <div class="horiz-header">
                  <span class="bench-tag">BENCH #${rc.b1No}</span>
                  <span class="pos-tag">${rc.rPos1}</span>
                </div>
                <div class="horiz-body">
                  <div class="seat-sublabel">SEAT 1 (LEFT)</div>
                  <div class="roll-line">${rc.b1L.rollNumber}</div>
                  <div class="name-line" title="${rc.b1L.name}">${rc.b1L.name}</div>
                  <div class="school-pill" title="${rc.b1L.school}">${rc.b1L.schoolDisplay}</div>
                </div>
              </div>
            ` : `<div class="horiz-empty">VACANT</div>`}

            <!-- Bench 1 Right Card -->
            ${rc.b1R ? `
              <div class="horiz-card card-col-2">
                <div class="horiz-header">
                  <span class="bench-tag">BENCH #${rc.b1No}</span>
                  <span class="pos-tag">${rc.rPos1}</span>
                </div>
                <div class="horiz-body">
                  <div class="seat-sublabel">SEAT 2 (RIGHT)</div>
                  <div class="roll-line">${rc.b1R.rollNumber}</div>
                  <div class="name-line" title="${rc.b1R.name}">${rc.b1R.name}</div>
                  <div class="school-pill" title="${rc.b1R.school}">${rc.b1R.schoolDisplay}</div>
                </div>
              </div>
            ` : `<div class="horiz-empty card-col-2">VACANT</div>`}

            <!-- Bench 2 Left Card -->
            ${rc.b2L ? `
              <div class="horiz-card card-col-3">
                <div class="horiz-header">
                  <span class="bench-tag">BENCH #${rc.b2No}</span>
                  <span class="pos-tag">${rc.rPos2}</span>
                </div>
                <div class="horiz-body">
                  <div class="seat-sublabel">SEAT 1 (LEFT)</div>
                  <div class="roll-line">${rc.b2L.rollNumber}</div>
                  <div class="name-line" title="${rc.b2L.name}">${rc.b2L.name}</div>
                  <div class="school-pill" title="${rc.b2L.school}">${rc.b2L.schoolDisplay}</div>
                </div>
              </div>
            ` : `<div class="horiz-empty card-col-3">VACANT</div>`}

            <!-- Bench 2 Right Card -->
            ${rc.b2R ? `
              <div class="horiz-card">
                <div class="horiz-header">
                  <span class="bench-tag">BENCH #${rc.b2No}</span>
                  <span class="pos-tag">${rc.rPos2}</span>
                </div>
                <div class="horiz-body">
                  <div class="seat-sublabel">SEAT 2 (RIGHT)</div>
                  <div class="roll-line">${rc.b2R.rollNumber}</div>
                  <div class="name-line" title="${rc.b2R.name}">${rc.b2R.name}</div>
                  <div class="school-pill" title="${rc.b2R.school}">${rc.b2R.schoolDisplay}</div>
                </div>
              </div>
            ` : `<div class="horiz-empty">VACANT</div>`}
          `).join('')}
        </div>

        <!-- Page Footer -->
        <div class="page-footer">
          <span>* Nirdesh: Har bench par Left aur Right seat par alag institute ke bache baithe hain. Roll number change na karein.</span>
          <span>Room ${r.roomNumber} of ${rooms.length} | Page ${r.roomNumber}</span>
        </div>

      </div>
    `;
  }).join('')}

  <script>
    let activeRoom = 1;

    function showRoom(num) {
      activeRoom = num;
      document.querySelectorAll('.room-page').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.room-page').forEach(el => el.classList.remove('active-print'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

      const target = document.getElementById('room-block-' + num);
      if (target) {
        target.style.display = 'flex';
        target.classList.add('active-print');
      }
      const tab = document.getElementById('tab-' + num);
      if (tab) tab.classList.add('active');
    }

    function printCurrentRoom() {
      document.body.className = 'print-single';
      window.print();
      document.body.className = '';
    }

    function printAllRooms() {
      document.body.className = 'print-all';
      window.print();
      document.body.className = '';
    }
  </script>
</body>
</html>`;

  fs.writeFileSync('exam_seating_arrangement_2026_2027.html', html, 'utf8');
  console.log('Saved wide horizontal cards HTML plan to exam_seating_arrangement_2026_2027.html');

  // Also export Master CSV
  try {
    const masterRows = [
      ['Room Number', 'Bench Number', 'Seat Position', 'Bench Row', 'Bench Column', 'Roll Number', 'Student Name', 'Father Name', 'School / Coaching', 'Subject', 'Class', 'Phone'].join(',')
    ];
    for (const rm of rooms) {
      for (const c of rm.allCards) {
        const rowPart = c.rowPos ? c.rowPos.split(', ')[0] : '';
        const colPart = c.rowPos ? c.rowPos.split(', ')[1] : '';
        masterRows.push([
          `"Room ${rm.roomNumber}"`,
          `"Bench ${c.benchNo}"`,
          `"${c.seatLabel}"`,
          `"${rowPart}"`,
          `"${colPart}"`,
          `"${c.rollNumber}"`,
          `"${(c.name || '').replace(/"/g, '""')}"`,
          `"${(c.fatherName || '').replace(/"/g, '""')}"`,
          `"${(c.school || '').replace(/"/g, '""')}"`,
          `"${c.subject || 'GK'}"`,
          `"${c.classPassed || ''}"`,
          `"${c.phone || ''}"`
        ].join(','));
      }
    }
    fs.writeFileSync('bench_seating_master_2026_2027.csv', masterRows.join('\n'), 'utf8');
    console.log('Saved updated bench_seating_master_2026_2027.csv');
  } catch (err) {
    if (err.code === 'EBUSY') {
      console.warn('⚠️ Warning: bench_seating_master_2026_2027.csv is open in Excel; could not overwrite.');
    } else {
      console.error('Error writing master CSV:', err);
    }
  }

  // Also export Room-wise Attendance CSV (Seat-wise / Bench-wise order: Bench 1 Left, Bench 1 Right...)
  try {
    const attRows = [
      ['Room', 'S.No.', 'Assigned Bench & Seat', 'Bench Row-Col', 'Roll Number', 'Student Name', 'Father Name', 'School / Coaching', 'Student Signature'].join(',')
    ];
    for (const rm of rooms) {
      rm.allCards.forEach((c, idx) => {
        const benchInfo = `Bench ${c.benchNo} (${c.sideType === 'L' ? 'Left' : 'Right'})`;
        const posInfo = c.rowPos ? `R${c.rowPos.match(/\d+/g)?.[0] || '?'}-C${c.rowPos.match(/\d+/g)?.[1] || '?'}` : '';
        attRows.push([
          `"Room ${rm.roomNumber}"`,
          `"${idx + 1}"`,
          `"${benchInfo}"`,
          `"${posInfo}"`,
          `"${c.rollNumber}"`,
          `"${(c.name || '').replace(/"/g, '""')}"`,
          `"${(c.fatherName || '').replace(/"/g, '""')}"`,
          `"${(c.school || '').replace(/"/g, '""')}"`,
          `""`
        ].join(','));
      });
    }
    fs.writeFileSync('bench_room_wise_attendance_sheet_seatwise.csv', attRows.join('\n'), 'utf8');
    console.log('Saved updated bench_room_wise_attendance_sheet_seatwise.csv (Seat-wise / Bench-wise)');
    fs.writeFileSync('bench_room_wise_attendance_sheet.csv', attRows.join('\n'), 'utf8');
    console.log('Saved updated bench_room_wise_attendance_sheet.csv (Seat-wise / Bench-wise)');
  } catch (err) {
    if (err.code === 'EBUSY') {
      console.warn('⚠️ Notice: bench_room_wise_attendance_sheet.csv is open in Excel. bench_room_wise_attendance_sheet_seatwise.csv was saved successfully!');
    } else {
      console.error('Error writing attendance CSV:', err);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
