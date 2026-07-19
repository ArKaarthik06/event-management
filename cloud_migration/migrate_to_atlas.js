/**
 * migrate_to_atlas.js
 * Migrates all data from local MongoDB → MongoDB Atlas
 * Uses mongoose (already installed) — no extra packages needed
 * Run: node migrate_to_atlas.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const LOCAL_URI = 'mongodb://localhost:27017/campus_events';

// Direct connection - bypasses SRV DNS lookup (blocked on many networks)
// Shard hosts discovered via: nslookup -type=SRV _mongodb._tcp.eventmanagement.84gkxd1.mongodb.net
const ATLAS_URI = 'mongodb://Root_Manager:rootmanager%401@ac-r0hdr8j-shard-00-00.84gkxd1.mongodb.net:27017,ac-r0hdr8j-shard-00-01.84gkxd1.mongodb.net:27017,ac-r0hdr8j-shard-00-02.84gkxd1.mongodb.net:27017/campus_events?tls=true&authSource=admin&retryWrites=true&w=majority';

async function migrate() {
  console.log('🚀 Starting migration: Local MongoDB → Atlas\n');

  // Connect to local MongoDB
  console.log('🔌 Connecting to local MongoDB...');
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('✅ Connected to local MongoDB\n');

  // Connect to Atlas
  console.log('🔌 Connecting to MongoDB Atlas (direct connection)...');
  const atlasConn = await mongoose.createConnection(ATLAS_URI, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    tls: true,
  }).asPromise();
  console.log('✅ Connected to MongoDB Atlas\n');

  try {
    const localDb = localConn.db;
    const atlasDb = atlasConn.db;

    // Get all collections from local DB
    const collections = await localDb.listCollections().toArray();

    if (collections.length === 0) {
      console.log('⚠️  No collections found in local database. Nothing to migrate.');
      return;
    }

    console.log(`📦 Found ${collections.length} collection(s): ${collections.map(c => c.name).join(', ')}\n`);

    let totalMigrated = 0;

    for (const collectionInfo of collections) {
      const collName = collectionInfo.name;
      const localColl = localDb.collection(collName);
      const atlasColl = atlasDb.collection(collName);

      const docs = await localColl.find({}).toArray();

      if (docs.length === 0) {
        console.log(`  ⏭️  [${collName}] — empty, skipping`);
        continue;
      }

      // Clear existing Atlas collection to avoid duplicates
      await atlasColl.deleteMany({});

      // Insert all documents
      const result = await atlasColl.insertMany(docs);
      console.log(`  ✅ [${collName}] — migrated ${result.insertedCount} documents`);
      totalMigrated += result.insertedCount;
    }

    console.log(`\n🎉 Migration complete! Total documents migrated: ${totalMigrated}`);

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await localConn.close();
    await atlasConn.close();
    console.log('🔒 Connections closed.');
  }
}

migrate().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
