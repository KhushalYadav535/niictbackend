const mongoose = require('mongoose');
require('dotenv').config();

function shortenSchoolName(raw) {
  if (!raw || raw.trim() === '' || raw.trim().toUpperCase() === 'NA') {
    return 'Independent / NA';
  }
  let s = raw.trim().replace(/\s+/g, ' ');

  // Common replacements for clean, professional compactness
  s = s.replace(/Mahavidyalay[a-z]*/gi, 'MV');
  s = s.replace(/Inter college|Inter College|Intermediate college|Intermediate College|Inter College/gi, 'IC');
  s = s.replace(/Degree College/gi, 'DC');
  s = s.replace(/Coaching center|Coaching Center|Coaching classes|Coaching Classes|Coaching Clasess/gi, 'Coaching');
  s = s.replace(/English medium school|English Medium School/gi, 'EMS');
  s = s.replace(/Convent school|Convent School/gi, 'Convent');
  s = s.replace(/Public school|Public School/gi, 'PS');
  s = s.replace(/Academy/gi, 'Acad.');
  s = s.replace(/Prayagraj|Jaunpur|Janghai/gi, ''); // remove city if redundant
  s = s.replace(/\s+/g, ' ').trim();

  // Specific canonical mappings
  const upper = s.toUpperCase();
  if (upper.includes('DHYEYA') || upper.includes('DHEYA')) return 'Dhyeya Study';
  if (upper.includes('TOP 10')) return 'Top 10 Classes';
  if (upper.includes('NDC')) return 'NDC Coaching';
  if (upper.includes('VIJAY')) return 'Vijay Coaching';
  if (upper.includes('NIC')) return 'NIC Janghai';
  if (upper.includes('NIICT')) return 'NIICT Computer';
  if (upper.includes('KDS') || upper.includes('K.D.S')) return 'KDS School';
  if (upper.includes('SACHIN')) return 'Sachin Coaching';
  if (upper.includes('KRISHNA')) return 'Krishna Coaching';
  if (upper.includes('GYANDEEP') || upper.includes('GYAN DEEP')) return 'Gyandeep Coaching';
  if (upper.includes('LAKSHYA')) return 'Lakshya Coaching';
  if (upper.includes('SARVODAYA') || upper.includes('SARVODYA')) return 'Sarvodaya IC';
  if (upper.includes('RD MEMORIAL') || upper.includes('R.D MEMORIAL') || upper.includes('R D MEMORIAL')) return 'RD Memorial IC';
  if (upper.includes('NAGRIK') || upper.includes('NAGARIK')) return 'Nagrik DC';
  if (upper.includes('DASAVANITI')) return 'Dasavaniti Devi MV';
  if (upper.includes('SHREE DEVI') || upper.includes('SRI DEVI')) return 'Shree Devi Prasad MV';
  if (upper.includes('SPEAK WELL')) return 'Speak Well Academy';
  if (upper.includes('MATA PITA')) return 'Mata Pita IC';
  if (upper.includes('SITA DEVI')) return 'Sita Devi IC';
  if (upper.includes('SDPG') || upper.includes('S D P G')) return 'SDPG College';
  if (upper.includes('SUBHASH')) return 'Subhash IC';
  if (upper.includes('SIC GARIYAW')) return 'SIC Gariyaw';

  // If still too long (> 20 chars), truncate cleanly
  if (s.length > 20) {
    s = s.slice(0, 19) + '…';
  }
  return s;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const CompetitionApplication = mongoose.model('CompetitionApplication', require('./models/CompetitionApplication').schema);

  const docs = await CompetitionApplication.find({ session: '2026-2027' }).sort({ rollNumber: 1 }).lean();
  console.log(`Testing on ${docs.length} applications:`);

  const results = docs.map(d => ({
    roll: d.rollNumber,
    name: d.name,
    raw: d.school,
    short: shortenSchoolName(d.school)
  }));

  // Show samples that were previously long
  console.log('\nSamples:');
  results.slice(0, 25).forEach(r => {
    console.log(`${r.roll} | ${r.name.padEnd(20)} | Orig: "${r.raw}" -> Short: "${r.short}" (len: ${r.short.length})`);
  });

  const longest = results.reduce((max, r) => r.short.length > max.short.length ? r : max, results[0]);
  console.log(`\nMax length of shortened school name: ${longest.short.length} ("${longest.short}")`);

  await mongoose.disconnect();
}
run();
