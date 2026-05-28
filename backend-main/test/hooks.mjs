/**
 * ─── Mocha Root Hook Plugin ─────────────────────────────────────────────────
 * This file is loaded once by Mocha (via .mocharc.cjs require) and provides
 * beforeAll / afterAll / afterEach hooks that are shared across ALL test files.
 *
 * It boots a single MongoMemoryServer instance for the entire test run.
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;

export const mochaHooks = {
  async beforeAll() {
    // Increase Mocha timeout for the binary download / server start
    this.timeout(60000);

    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "1h";

    mongoServer = await MongoMemoryServer.create({
      instance: { launchTimeout: 60000 },
    });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  },

  async afterEach() {
    // Clear all collections between tests
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  },

  async afterAll() {
    this.timeout(15000);
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  },
};
