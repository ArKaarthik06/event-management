/**
 * export_to_json.js
 * Exports all local MongoDB collections to JSON files in ./atlas_export/
 * Run: node export_to_json.js
 * Then import each JSON file via Atlas UI → Browse Collections → Add Data → Import JSON
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const LOCAL_URI = 'mongodb://localhost:27017/campus_events';
const EXPORT_DIR = path.join(__dirname, 'atlas_export');

async function exportData() {
  console.log('🚀 Exporting local MongoDB data to JSON files\n');

  // Create export directory
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR);
  }

  console.log('🔌 Connecting to local MongoDB...');
  const conn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('✅ Connected to local MongoDB\n');

  try {
    const db = conn.db;
    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
      console.log('⚠️  No collections found. Nothing to export.');
      return;
    }

    console.log(`📦 Found ${collections.length} collection(s): ${collections.map(c => c.name).join(', ')}\n`);

    for (const collInfo of collections) {
      const collName = collInfo.name;
      const coll = db.collection(collName);
      const docs = await coll.find({}).toArray();

      if (docs.length === 0) {
        console.log(`  ⏭️  [${collName}] — empty, skipping`);
        continue;
      }

      const filePath = path.join(EXPORT_DIR, `${collName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
      console.log(`  ✅ [${collName}] — exported ${docs.length} documents → atlas_export/${collName}.json`);
    }

    console.log('\n🎉 Export complete!');
    console.log(`📁 Files saved to: ${EXPORT_DIR}`);
    console.log('\n📋 Next steps — Import via Atlas UI:');
    console.log('   1. Go to cloud.mongodb.com → your cluster → Browse Collections');
    console.log('   2. Click "Add Data" → "Import JSON or CSV file"');
    console.log('   3. Select database: campus_events');
    console.log('   4. Import each .json file from the atlas_export folder');

  } finally {
    await conn.close();
    console.log('\n🔒 Connection closed.');
  }
}

exportData().catch(err => {
  console.error('❌ Export failed:', err.message);
  process.exit(1);
});
