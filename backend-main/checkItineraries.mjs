import mongoose from "mongoose";

await mongoose.connect("mongodb://localhost:27017/test");

const Itinerary = mongoose.model(
  "Itinerary",
  new mongoose.Schema({}, { strict: false }),
  "itineraries",
);
const ItineraryItem = mongoose.model(
  "ItineraryItem",
  new mongoose.Schema({}, { strict: false }),
  "itinerary_items",
);

console.log("\n=== ITINERARIES ===");
const itineraries = await Itinerary.find({}).lean();
console.log(`Total: ${itineraries.length}`);
itineraries.forEach((itin) => {
  console.log(`ID: ${itin._id} | Name: ${itin.trip_name} | Type: ${itin.type}`);
});

console.log("\n=== ITINERARY ITEMS ===");
const items = await ItineraryItem.find({}).lean();
console.log(`Total: ${items.length}`);

// Check for orphaned items (items pointing to non-existent itineraries)
const validIds = new Set(itineraries.map((i) => i._id));
const orphanedItems = items.filter((item) => !validIds.has(item.itinerary_id));

if (orphanedItems.length > 0) {
  console.log(
    `\n⚠️  FOUND ${orphanedItems.length} ORPHANED ITEMS (pointing to deleted itineraries):`,
  );
  orphanedItems.forEach((item) => {
    console.log(
      `  - Item ID: ${item._id}, Points to: ${item.itinerary_id}, Title: ${item.title}`,
    );
  });
}

// Check for duplicate IDs
const idCounts = {};
itineraries.forEach((itin) => {
  idCounts[itin._id] = (idCounts[itin._id] || 0) + 1;
});
const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
if (duplicates.length > 0) {
  console.log(`\n⚠️  FOUND ${duplicates.length} DUPLICATE ITINERARY IDs:`);
  duplicates.forEach(([id, count]) => {
    console.log(`  - ID: ${id} appears ${count} times`);
  });
}

await mongoose.disconnect();
