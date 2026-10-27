const mongoose = require('mongoose');
require('dotenv').config();
const Result = require('./models/Result');

async function unpublishOld() {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    throw new Error('MONGODB_URI not found in environment!');
  }

  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connected to MongoDB\n');

  console.log('🔒 Step 1: Unpublishing all previous year/non-2026-2027 exam results...');
  const res = await Result.updateMany(
    {
      session: { $ne: '2026-2027' }
    },
    {
      $set: { isPublished: false }
    }
  );

  console.log(`✅ Unpublish complete! Modified count: ${res.modifiedCount}`);

  console.log('\n🔒 Step 2: Ensuring all current session (2026-2027) exam results are published...');
  const resCurr = await Result.updateMany(
    {
      session: '2026-2027'
    },
    {
      $set: { isPublished: true }
    }
  );
  console.log(`✅ Current session results verified published! Count: ${resCurr.matchedCount}`);

  console.log('\n📊 Final Verification:');
  const published2026 = await Result.countDocuments({ session: '2026-2027', isPublished: true });
  const publishedOld = await Result.countDocuments({ session: { $ne: '2026-2027' }, isPublished: true });
  const totalOld = await Result.countDocuments({ session: { $ne: '2026-2027' } });

  console.log(`- Current Session 2026-2027 Published Results: ${published2026}`);
  console.log(`- Old/Previous Sessions Published Results: ${publishedOld} (Must be 0)`);
  console.log(`- Old/Previous Sessions Total Archived (Unpublished): ${totalOld}`);

  await mongoose.disconnect();
  console.log('\n✅ Disconnected cleanly.');
}

unpublishOld().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
