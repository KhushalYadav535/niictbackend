// Minimal roll number generator for Admissions
// Format: ADMYYYYMMDD-XXXX (random 4 digits)

function pad(num, size) {
  const s = String(num);
  if (s.length >= size) return s;
  return '0'.repeat(size - s.length) + s;
}

async function generateSimpleSerialRollNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1, 2);
  const d = pad(now.getDate(), 2);
  const rand = pad(Math.floor(Math.random() * 10000), 4);
  return `ADM${y}${m}${d}-${rand}`;
}

module.exports = { generateSimpleSerialRollNumber };



