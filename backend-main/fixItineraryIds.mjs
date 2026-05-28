import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017/");

async function fixIds() {
  await client.connect();
  const db = client.db("test");
  const itineraries = db.collection("itineraries");
  const items = db.collection("itineraryitems");

  // Find all itineraries with ObjectId _id
  const docs = await itineraries.find({}).toArray();

  console.log(`Found ${docs.length} itineraries`);

  for (const doc of docs) {
    if (doc._id instanceof ObjectId) {
      const oldId = doc._id;
      const newId = doc._id.toString();

      console.log(`Converting ${doc.trip_name}: ${oldId} -> ${newId}`);

      // Create new document with string ID
      const newDoc = { ...doc, _id: newId };
      await itineraries.insertOne(newDoc);

      // Update all itinerary items
      const updateResult = await items.updateMany(
        { itinerary_id: oldId },
        { $set: { itinerary_id: newId } },
      );
      console.log(`  Updated ${updateResult.modifiedCount} items`);

      // Delete old document
      await itineraries.deleteOne({ _id: oldId });
    } else {
      console.log(`Skipping ${doc.trip_name}: already string ID (${doc._id})`);
    }
  }

  console.log("\nDone!");
  await client.close();
}

fixIds().catch(console.error);
