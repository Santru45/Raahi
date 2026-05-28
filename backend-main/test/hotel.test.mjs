/**
 * ─── Hotel API Tests ────────────────────────────────────────────────────────
 */

import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";
import express from "express";
import passport from "passport";
import supertest from "supertest";
import configurePassport from "../src/config/passport.js";
import { hotelRoutes } from "../src/routes/hotel.routes.js";
import Hotel from "../src/models/hotel.model.js";
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
  app.use("/api/hotels", hotelRoutes);

  request = supertest(app);
});

afterEach(() => {
  sinon.restore();
});

const sampleHotel = () => ({
  name: "Taj Palace",
  hotelType: "luxury",
  location: { city: "Mumbai", state: "Maharashtra", country: "India" },
  starRating: 5,
  marketRate: 8000,
  images: ["https://example.com/taj.jpg"],
  amenities: ["wifi", "pool", "spa"],
  description: "A luxurious five-star hotel.",
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/hotels
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/hotels", () => {
  it("should return empty array when no hotels exist", async () => {
    const res = await request.get("/api/hotels");
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array").that.is.empty;
  });

  it("should return all hotels (public — no auth needed)", async () => {
    await Hotel.create(sampleHotel());
    await Hotel.create({ ...sampleHotel(), name: "Oberoi" });

    const res = await request.get("/api/hotels");

    expect(res.status).to.equal(200);
    expect(res.body).to.have.lengthOf(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/hotels/:id
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/hotels/:id", () => {
  it("should return hotel by id", async () => {
    const hotel = await Hotel.create(sampleHotel());

    const res = await request.get(`/api/hotels/${hotel._id}`);

    expect(res.status).to.equal(200);
    expect(res.body.name).to.equal("Taj Palace");
  });

  it("should return 404 for non-existent hotel", async () => {
    const fakeId = randomObjectId();

    const res = await request.get(`/api/hotels/${fakeId}`);

    expect(res.status).to.equal(404);
    expect(res.body.message).to.equal("Hotel not found");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/hotels/:id (auth required)
// ═══════════════════════════════════════════════════════════════════════════════
describe("PATCH /api/hotels/:id", () => {
  it("should update hotel with auth", async () => {
    const { token } = await createAuthenticatedUser();
    const hotel = await Hotel.create(sampleHotel());

    const res = await request
      .patch(`/api/hotels/${hotel._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Taj Mahal Palace" });

    expect(res.status).to.equal(200);
    expect(res.body.name).to.equal("Taj Mahal Palace");
  });

  it("should return 401 without auth", async () => {
    const hotel = await Hotel.create(sampleHotel());

    const res = await request
      .patch(`/api/hotels/${hotel._id}`)
      .send({ name: "No Auth" });

    expect(res.status).to.equal(401);
  });

  it("should return 404 for non-existent hotel", async () => {
    const { token } = await createAuthenticatedUser();
    const fakeId = randomObjectId();

    const res = await request
      .patch(`/api/hotels/${fakeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Ghost Hotel" });

    expect(res.status).to.equal(404);
  });
});
