/**
 * ─── User API Tests ─────────────────────────────────────────────────────────
 */

import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";
import express from "express";
import passport from "passport";
import supertest from "supertest";
import configurePassport from "../src/config/passport.js";
import { userRoutes } from "../src/routes/user.routes.js";
import {
  createAuthenticatedUser,
  createAdminUser,
  randomObjectId,
} from "./helpers/testHelper.mjs";

let app, request;

before(async function () {
  this.timeout(30000);
  configurePassport();

  app = express();
  app.use(express.json());
  app.use(passport.initialize());
  app.use("/api/users", userRoutes);

  request = supertest(app);
});

afterEach(() => {
  sinon.restore();
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/users/:id
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/users/:id", () => {
  it("should return user by id (authenticated)", async () => {
    const { user, token } = await createAuthenticatedUser();

    const res = await request
      .get(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.name).to.equal("Test User");
    expect(res.body).to.not.have.property("passwordHash");
  });

  it("should return 404 for non-existent user", async () => {
    const { token } = await createAuthenticatedUser();
    const fakeId = randomObjectId();

    const res = await request
      .get(`/api/users/${fakeId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(404);
  });

  it("should return 401 without auth token", async () => {
    const { user } = await createAuthenticatedUser();

    const res = await request.get(`/api/users/${user._id}`);

    expect(res.status).to.equal(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/users/:id
// ═══════════════════════════════════════════════════════════════════════════════
describe("PATCH /api/users/:id", () => {
  it("should update user name", async () => {
    const { user, token } = await createAuthenticatedUser();

    const res = await request
      .patch(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Name" });

    expect(res.status).to.equal(200);
    expect(res.body.name).to.equal("Updated Name");
  });

  it("should NOT allow role change via update", async () => {
    const { user, token } = await createAuthenticatedUser();

    const res = await request
      .patch(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "admin" });

    expect(res.status).to.equal(200);
    expect(res.body.role).to.equal("customer"); // role unchanged
  });

  it("should NOT allow passwordHash change via update", async () => {
    const { user, token } = await createAuthenticatedUser();

    await request
      .patch(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ passwordHash: "hacked" });

    // Verify password was NOT changed
    const dbUser = await mongoose.model("User").findById(user._id);
    expect(dbUser.passwordHash).to.not.equal("hacked");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/users (admin only)
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/users (admin)", () => {
  it("should return all users for admin", async () => {
    const { token } = await createAdminUser();
    await createAuthenticatedUser({ email: "extra@test.com" });

    const res = await request
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array");
    expect(res.body.length).to.be.at.least(2);
  });

  it("should return 403 for non-admin user", async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE /api/users/:id (admin only)
// ═══════════════════════════════════════════════════════════════════════════════
describe("DELETE /api/users/:id", () => {
  it("should delete user and all associated data (admin)", async () => {
    const { token } = await createAdminUser();
    const { user: victim } = await createAuthenticatedUser({
      email: "victim@test.com",
    });

    const res = await request
      .delete(`/api/users/${victim._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.include("deleted");

    // Verify user no longer exists
    const found = await mongoose.model("User").findById(victim._id);
    expect(found).to.be.null;
  });

  it("should return 403 for non-admin", async () => {
    const { token, user } = await createAuthenticatedUser();

    const res = await request
      .delete(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/users/by-email
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/users/by-email", () => {
  it("should find user by email", async () => {
    const { user, token } = await createAuthenticatedUser({
      email: "findme@test.com",
    });

    const res = await request
      .get("/api/users/by-email?email=findme@test.com")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.email).to.equal("findme@test.com");
  });

  it("should return 400 if email param is missing", async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request
      .get("/api/users/by-email")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(400);
  });
});
