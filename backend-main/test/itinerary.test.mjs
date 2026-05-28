/**
 * ─── Itinerary API Tests ────────────────────────────────────────────────────
 */

import { expect } from "chai";
import sinon from "sinon";
import express from "express";
import supertest from "supertest";
import { itineraryRoutes } from "../src/routes/itinerary.routes.js";
import Itinerary from "../src/models/itinerary/Itinerary.js";
let app, request;

before(async function () {
  this.timeout(30000);

  app = express();
  app.use(express.json());
  app.use("/api/itineraries", itineraryRoutes);

  request = supertest(app);
});

afterEach(() => {
  sinon.restore();
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/itineraries
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/itineraries", () => {
  it("should create a new itinerary", async () => {
    const res = await request.post("/api/itineraries").send({
      user_id: "user_123",
      trip_name: "Goa Beach Trip",
      destination: "Goa",
      start_date: "2025-01-15",
      end_date: "2025-01-20",
    });

    expect(res.status).to.equal(201);
    expect(res.body.trip_name).to.equal("Goa Beach Trip");
    expect(res.body.destination).to.equal("Goa");
    expect(res.body.type).to.equal("custom");
    expect(res.body.images).to.be.an("array").that.is.not.empty;
  });

  it("should return 400 for missing trip_name", async () => {
    const res = await request.post("/api/itineraries").send({
      user_id: "user_123",
      destination: "Goa",
    });

    expect(res.status).to.equal(400);
    expect(res.body.error).to.include("Trip name is required");
  });

  it("should return 400 for trip_name less than 3 chars", async () => {
    const res = await request.post("/api/itineraries").send({
      trip_name: "Go",
    });

    expect(res.status).to.equal(400);
    expect(res.body.error).to.include("at least 3");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/itineraries
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/itineraries", () => {
  it("should return all itineraries", async () => {
    await Itinerary.create({
      _id: "itn_1",
      trip_name: "Trip A",
      type: "custom",
    });
    await Itinerary.create({
      _id: "itn_2",
      trip_name: "Trip B",
      type: "custom",
    });

    const res = await request.get("/api/itineraries");

    expect(res.status).to.equal(200);
    expect(res.body).to.have.lengthOf(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/itineraries/:id
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/itineraries/:id", () => {
  it("should return itinerary by id", async () => {
    await Itinerary.create({
      _id: "itn_100",
      trip_name: "Kerala Trip",
      type: "custom",
    });

    const res = await request.get("/api/itineraries/itn_100");

    expect(res.status).to.equal(200);
    expect(res.body.trip_name).to.equal("Kerala Trip");
  });

  it("should return 404 for non-existent itinerary", async () => {
    const res = await request.get("/api/itineraries/itn_nonexistent");

    expect(res.status).to.equal(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/itineraries/:id
// ═══════════════════════════════════════════════════════════════════════════════
describe("PATCH /api/itineraries/:id", () => {
  it("should update itinerary fields", async () => {
    await Itinerary.create({
      _id: "itn_200",
      trip_name: "Old Name",
      type: "custom",
    });

    const res = await request
      .patch("/api/itineraries/itn_200")
      .send({ trip_name: "New Name", destination: "Manali" });

    expect(res.status).to.equal(200);
    expect(res.body.trip_name).to.equal("New Name");
    expect(res.body.destination).to.equal("Manali");
  });

  it("should return 404 for non-existent itinerary", async () => {
    const res = await request
      .patch("/api/itineraries/itn_ghost")
      .send({ trip_name: "Ghost" });

    expect(res.status).to.equal(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE /api/itineraries/:id
// ═══════════════════════════════════════════════════════════════════════════════
describe("DELETE /api/itineraries/:id", () => {
  it("should delete an itinerary", async () => {
    await Itinerary.create({
      _id: "itn_300",
      trip_name: "To Delete",
      type: "custom",
    });

    const res = await request.delete("/api/itineraries/itn_300");

    expect(res.status).to.equal(200);
    expect(res.body.deleted).to.equal("itn_300");

    // Verify it's gone
    const check = await Itinerary.findById("itn_300");
    expect(check).to.be.null;
  });

  it("should return 404 for non-existent itinerary", async () => {
    const res = await request.delete("/api/itineraries/itn_nope");

    expect(res.status).to.equal(404);
  });
});
