/**
 * ─── Review API Tests ───────────────────────────────────────────────────────
 */

import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";
import express from "express";
import passport from "passport";
import supertest from "supertest";
import configurePassport from "../src/config/passport.js";
import { reviewRoutes } from "../src/routes/review.routes.js";
import Review from "../src/models/review/review.model.js";
import {
  createAuthenticatedUser,
  randomObjectId,
} from "./helpers/testHelper.mjs";

let app, request;

before(async function () {
  this.timeout(30000);
  configurePassport();

  app = express();
  app.use(express.json());
  app.use(passport.initialize());
  app.use("/api/reviews", reviewRoutes);

  request = supertest(app);
});

afterEach(() => {
  sinon.restore();
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/reviews  (auth required)
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/reviews", () => {
  it("should create a review", async () => {
    const { user, token } = await createAuthenticatedUser();
    const entityId = randomObjectId();

    const res = await request
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({
        entityId,
        entityType: "hotel",
        rating: 4.5,
        comment: "Great stay!",
        year: 2025,
      });

    expect(res.status).to.equal(201);
    expect(res.body.rating).to.equal(4.5);
    expect(res.body.comment).to.equal("Great stay!");
    expect(res.body.entityType).to.equal("hotel");
  });

  it("should prevent duplicate review (same user + entity)", async () => {
    const { user, token } = await createAuthenticatedUser();
    const entityId = randomObjectId();

    // First review
    await request
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({
        entityId,
        entityType: "hotel",
        rating: 4,
        comment: "Nice",
        year: 2025,
      });

    // Duplicate
    const res = await request
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({
        entityId,
        entityType: "hotel",
        rating: 5,
        comment: "Duplicate",
        year: 2025,
      });

    expect(res.status).to.equal(409);
    expect(res.body.message).to.include("Already reviewed");
  });

  it("should return 401 without auth", async () => {
    const res = await request.post("/api/reviews").send({
      entityId: randomObjectId(),
      entityType: "hotel",
      rating: 3,
      comment: "No auth",
      year: 2025,
    });

    expect(res.status).to.equal(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/reviews?entityId=xxx
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/reviews?entityId=xxx", () => {
  it("should return reviews with avgRating and total", async () => {
    const entityId = new mongoose.Types.ObjectId();
    const userId1 = new mongoose.Types.ObjectId();
    const userId2 = new mongoose.Types.ObjectId();

    await Review.create({
      userId: userId1,
      entityId,
      entityType: "hotel",
      rating: 4,
      comment: "Good",
      year: 2025,
    });
    await Review.create({
      userId: userId2,
      entityId,
      entityType: "hotel",
      rating: 5,
      comment: "Excellent",
      year: 2025,
    });

    const res = await request.get(`/api/reviews?entityId=${entityId}`);

    expect(res.status).to.equal(200);
    expect(res.body.total).to.equal(2);
    expect(res.body.avgRating).to.equal(4.5);
    expect(res.body.reviews).to.be.an("array");
  });

  it("should return 400 when entityId missing (and no userId)", async () => {
    const res = await request.get("/api/reviews");

    expect(res.status).to.equal(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/reviews/:id  (auth required)
// ═══════════════════════════════════════════════════════════════════════════════
describe("PUT /api/reviews/:id", () => {
  it("should update a review by id", async () => {
    const { user, token } = await createAuthenticatedUser();
    const entityId = new mongoose.Types.ObjectId();

    const created = await Review.create({
      userId: user._id,
      entityId,
      entityType: "hotel",
      rating: 3,
      comment: "Average",
      year: 2025,
    });

    const res = await request
      .put(`/api/reviews/${created._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 5, comment: "Updated — Amazing!" });

    expect(res.status).to.equal(200);
    expect(res.body.rating).to.equal(5);
    expect(res.body.comment).to.equal("Updated — Amazing!");
  });

  it("should return 404 for non-existent review", async () => {
    const { token } = await createAuthenticatedUser();
    const fakeId = randomObjectId();

    const res = await request
      .put(`/api/reviews/${fakeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 1, comment: "Ghost" });

    expect(res.status).to.equal(404);
  });
});
