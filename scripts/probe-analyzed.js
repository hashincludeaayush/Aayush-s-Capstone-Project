const fs = require("fs");
const mongoose = require("mongoose");

function loadDotEnv(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadDotEnv(".env");

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error("Usage: node scripts/probe-analyzed.js <productId>");
    process.exit(2);
  }

  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(2);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const candidates = [
    { db: "analyzed", col: "analyzed" },
    { db: "analyzed", col: "Analyzed" },
    { db: "Analyzed", col: "analyzed" },
    { db: "Analyzed", col: "Analyzed" },
  ];

  let doc = null;

  for (const c of candidates) {
    const db = mongoose.connection.useDb(c.db);
    const col = db.collection(c.col);
    console.log(`--- trying ${c.db}.${c.col} ---`);

    try {
      doc = await col.findOne({ _id: new mongoose.Types.ObjectId(id) });
      console.log("lookup ObjectId:", !!doc);
    } catch (e) {
      console.log("lookup ObjectId threw:", e && e.message);
    }

    if (!doc) {
      doc = await col.findOne({ _id: id });
      console.log("lookup string:", !!doc);
    }

    if (!doc) {
      doc = await col.findOne({ "_id.$oid": id });
      console.log("lookup _id.$oid:", !!doc);
    }

    if (doc) break;
  }

  if (doc) {
    const typeName =
      doc._id && doc._id.constructor
        ? doc._id.constructor.name
        : typeof doc._id;
    console.log("stored _id type:", typeName);
    console.log("top-level keys:", Object.keys(doc));
    console.log("sample deal_score:", doc.deal_score);
  } else {
    console.log("No analyzed doc found for id", id);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
