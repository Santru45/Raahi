/**
 * ─── Test Setup ─────────────────────────────────────────────────────────────
 * This file boots an in-memory MongoDB instance so tests run without needing
 * a real database. It connects mongoose before any test and tears down after.
 *
 * Uses:  mongodb-memory-server  (downloads a small mongod binary on first run)
 *        mongoose               (same ORM the app uses)
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;

/**
 * Start in-memory MongoDB and connect mongoose.
 * Called automatically by Mocha before all tests.
 */
export async function connectTestDB() {
  mongoServer = await MongoMemoryServer.create({
    instance: { launchTimeout: 60000 },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

/**
 * Drop every collection (clean slate between test suites).
 */
export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Disconnect mongoose and stop the in-memory server.
 */
export async function closeTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
}
