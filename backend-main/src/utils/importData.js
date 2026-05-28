import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

export const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // read db.json
    const db = JSON.parse(fs.readFileSync('./src/utils/db.json', 'utf-8'));

    // collections to import — skip $schema
    const skip = ['$schema'];

    for (const [collectionName, documents] of Object.entries(db)) {
      if (skip.includes(collectionName)) continue;
      if (!Array.isArray(documents) || documents.length === 0) {
        console.log(`⚠️  Skipping ${collectionName} — empty or not an array`);
        continue;
      }

      const collection = mongoose.connection.collection(collectionName);

      // clear existing data first
      await collection.deleteMany({});

      // insert all documents
      await collection.insertMany(documents, { ordered: false });
      console.log(
        `✅  ${collectionName} — ${documents.length} documents imported`,
      );
    }

    console.log('\n All collections imported successfully');
    mongoose.disconnect();
  } catch (err) {
    console.error('Import failed:', err.message);
    mongoose.disconnect();
  }
};

