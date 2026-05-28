/**
 * ─── Test Helper ────────────────────────────────────────────────────────────
 * Utility functions shared across backend test files.
 */

import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { userModel } from "../../src/models/user.model.js"; // helpers is test/helpers, so ../../src is correct
import bcrypt from "bcrypt";

/**
 * Create a test user in the database and return { user, token }.
 * Useful for routes that require JWT authentication.
 */
export async function createAuthenticatedUser(overrides = {}) {
  const passwordHash = await bcrypt.hash("Test1234!", 10);
  const user = await userModel.create({
    name: overrides.name || "Test User",
    email: overrides.email || `test-${Date.now()}@example.com`,
    phone: overrides.phone || "9876543210",
    passwordHash,
    role: overrides.role || "customer",
    loyaltyAccountId:
      "LOY-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
    ...overrides,
  });

  const token = jwt.sign(
    { id: user._id.toString() },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1h" },
  );

  return { user, token };
}

/**
 * Create an admin user.
 */
export async function createAdminUser() {
  return createAuthenticatedUser({
    role: "admin",
    email: `admin-${Date.now()}@example.com`,
    name: "Admin User",
  });
}

/**
 * Generate a valid ObjectId string.
 */
export function randomObjectId() {
  return new mongoose.Types.ObjectId().toString();
}
