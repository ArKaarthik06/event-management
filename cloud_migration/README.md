# 📂 cloud_migration/ — AWS Migration Scripts

This folder contains all scripts used to migrate the Campus Event Management app to the cloud.

---

## 📁 Files in this folder

| File | Purpose |
|---|---|
| `migrate_to_atlas.js` | Migrates all data from local MongoDB → MongoDB Atlas |
| `export_to_json.js` | Exports local collections to JSON files (backup / manual import) |
| `README.md` | This file — explains how everything works |

---

## 🔍 Deep Dive: `migrate_to_atlas.js` — Line by Line

### The Big Picture (what this script does)

```
Local MongoDB                           MongoDB Atlas (Cloud)
(localhost:27017)                       (aws ap-south-1)
      │                                        │
      │  1. Read every collection              │
      │──────────────────────────────────────>│
      │  2. Wipe Atlas collection              │
      │  3. Write all docs to Atlas            │
      │──────────────────────────────────────>│
      │                                        │
      └── close ─────────────────── close ────┘
```

---

### Line-by-Line Explanation

```js
const mongoose = require('mongoose');
```
**`require('mongoose')`** — Loads the Mongoose library.
Mongoose is an ODM (Object Data Modeler) for MongoDB. Here we use it
not for models/schemas, but for its **connection management** — because
it is already installed in the project (no extra install needed).

---

```js
dotenv.config();
```
**`dotenv.config()`** — Reads the `.env` file and loads every KEY=VALUE
pair into `process.env`. After this line, `process.env.MONGO_URI` is
available. Without it, that value would be `undefined`.

---

```js
const LOCAL_URI = 'mongodb://localhost:27017/campus_events';
const ATLAS_URI = 'mongodb://Root_Manager:...@shard-00-00...,shard-00-01...,shard-00-02.../campus_events?tls=true&authSource=admin';
```

These are **connection strings (URIs)**. Think of them like a full address:
- **Who you are** → username + password
- **Where to connect** → hostname + port
- **Which database** → /campus_events
- **How to connect** → ?tls=true (encrypted), authSource=admin

The Atlas URI lists 3 hosts (shards) — 3 copies of your database for
redundancy. The driver picks the primary one automatically.

---

```js
const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
```

**`mongoose.createConnection(URI)`** — Creates an *independent* database
connection object. Unlike `mongoose.connect()` (which sets a global
connection), this lets you have TWO databases open at the same time.

**`.asPromise()`** — Mongoose connections internally use events
(`.on('open', ...)`). `.asPromise()` wraps that in a Promise so you can
use `await` — pausing execution until the connection is fully ready.

**`await`** — Pauses here until both connections are open before moving on.

---

```js
const localDb = localConn.db;
const atlasDb = atlasConn.db;
```

**`.db`** — Accesses the raw **MongoDB Database object** underneath Mongoose.
Mongoose adds schema/model layers on top. `.db` drops to the raw driver
level, giving access to `listCollections()`, `collection()` etc. — which
work without a predefined schema. Needed here since we don't know in
advance what collections exist.

---

```js
const collections = await localDb.listCollections().toArray();
```

**`listCollections()`** — Asks MongoDB: "What collections exist in this
database?" Returns a **cursor** (a lazy pointer to results — no data
downloaded yet).

**`.toArray()`** — Tells the cursor to fetch all results and put them in
a JavaScript array. Result looks like:
`[{ name: 'users' }, { name: 'events' }, { name: 'comments' }]`

---

```js
const localColl = localDb.collection(collName);
const atlasColl = atlasDb.collection(collName);
```

**`db.collection(name)`** — Gets a **Collection handle** (like a reference
to a table). Does NOT fetch any data — just creates an object you can
call `.find()`, `.insertMany()` etc. on.

---

```js
const docs = await localColl.find({}).toArray();
```

**`.find({})`** — Queries the collection. `{}` = empty filter = match
everything. Equivalent to SQL: `SELECT * FROM users`. Returns a cursor.

**`.toArray()`** — Downloads all documents into a JS array in memory.
Each document is a plain JS object with all its fields + `_id`.

---

```js
await atlasColl.deleteMany({});
```

**`.deleteMany({})`** — Deletes ALL documents from the Atlas collection.
`{}` = empty filter = delete everything. Why? To prevent **duplicates**
if the migration is run more than once. Equivalent to SQL: `DELETE FROM users`.

---

```js
const result = await atlasColl.insertMany(docs);
console.log(`migrated ${result.insertedCount} documents`);
```

**`.insertMany(docs)`** — Inserts the entire array of documents into Atlas
in ONE batch (single network round-trip — much faster than one-by-one).
Returns a result with `insertedCount` and `insertedIds`.
Crucially, it **preserves the original `_id` values** — so all links
between documents (e.g. event comments referencing event IDs) stay intact.

---

```js
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
} finally {
  await localConn.close();
  await atlasConn.close();
}
```

**`try/catch/finally`** — Error handling:
- `catch` — if anything throws, prints the error message
- `process.exit(1)` — force-quits Node.js with exit code 1 (error signal)
- `finally` — runs NO MATTER WHAT (success or failure). Used to clean up.
- `.close()` — closes the TCP connection. Without this Node.js would hang
  open forever since MongoDB connections stay alive.

---

## Full Execution Flow

```
node migrate_to_atlas.js
        |
        v
dotenv.config()           --> Load .env into process.env
        |
        v
createConnection(LOCAL)   --> Open TCP socket to localhost:27017
        |   .asPromise()  --> Wait until connection is ready
        v
createConnection(ATLAS)   --> Open TLS/TCP socket to 3 Atlas shards
        |   .asPromise()  --> Wait until connection is ready
        v
listCollections()          --> Ask local DB: what collections exist?
        |   .toArray()    --> Get them as a JS array
        v
for each collection:
  |-- collection(name)     --> Get handle to this collection
  |-- find({}).toArray()   --> Read ALL documents into memory
  |-- deleteMany({})       --> Wipe Atlas copy (prevent duplicates)
  |-- insertMany(docs)     --> Write all docs to Atlas in one batch
        |
        v
close() both connections  --> Clean up TCP sockets
        |
        v
Process exits successfully
```

---

## How to Run

```bash
# Must be on mobile hotspot (college network blocks port 27017)

# Run migration (requires local MongoDB running)
node cloud_migration/migrate_to_atlas.js

# Or export to JSON files (works on any network)
node cloud_migration/export_to_json.js
```
