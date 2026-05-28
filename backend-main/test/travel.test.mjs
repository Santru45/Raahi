/**
 * ─── Travel API Tests ───────────────────────────────────────────────────────
 *
 * Covers:
 *   - GET  /api/travel/travelServices      (public)
 *   - GET  /api/travel/locations            (public)
 *   - GET  /api/travel/boardingPoints       (public)
 *   - GET  /api/travel/bookedSeats          (public)
 *   - GET  /api/travel/travelBookings       (public – PNR lookup)
 *   - POST /api/travel/travelBookings       (protected – create booking)
 *   - POST /api/travel/bookedSeats          (protected – save booked seat)
 *   - PATCH /api/travel/travelServices/:id  (protected – update seats)
 *   - PATCH /api/travel/travelBookings/:id/cancel (protected – cancel booking)
 */

import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";
import express from "express";
import passport from "passport";
import supertest from "supertest";
import configurePassport from "../src/config/passport.js";
import { travelRoutes } from "../src/routes/travel.routes.js";
import TravelService from "../src/models/travel/TravelService.js";
import TravelBooking from "../src/models/travel/TravelBooking.js";
import BookedSeat from "../src/models/travel/BookedSeat.js";
import Location from "../src/models/travel/Location.js";
import BoardingPoint from "../src/models/travel/BoardingPoint.js";
import Wallet from "../src/models/wallet.model.js";
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
  app.use("/api/travel", travelRoutes);

  request = supertest(app);
});

afterEach(() => {
  sinon.restore();
});

// ── Sample data factories ───────────────────────────────────────────────────

const sampleService = (overrides = {}) => ({
  type: "flight",
  operatorName: "IndiGo",
  serviceNumber: "6E-2045",
  from: "Mumbai",
  to: "Delhi",
  schedule: {
    departureTime: new Date("2025-08-15T06:00:00Z"),
    arrivalTime: new Date("2025-08-15T08:30:00Z"),
    duration: "2h 30m",
  },
  fare: 4500,
  marketRate: 5200,
  totalSeats: 180,
  availableSeats: 120,
  cabinClass: "economy",
  amenities: ["wifi", "meals"],
  taxPercent: 12,
  isActive: true,
  ...overrides,
});

const sampleBookingBody = (serviceId) => ({
  serviceId: serviceId.toString(),
  bookingReference: "PNR-" + Date.now(),
  ticketId: "TKT-001",
  passengers: [
    {
      firstName: "Ravi",
      lastName: "Kumar",
      isPrimary: true,
      idType: "aadhaar",
      idNumber: "1234-5678-9012",
      seatNumber: "12A",
      gender: "male",
    },
  ],
  pricing: {
    baseAmount: 4500,
    taxAmount: 540,
    discountAmount: 0,
    totalAmount: 5040,
    currency: "INR",
  },
  paymentMethod: "wallet",
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/travel/travelServices
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/travel/travelServices", () => {
  it("should return all active travel services", async () => {
    await TravelService.create(sampleService());
    await TravelService.create(
      sampleService({ operatorName: "Air India", serviceNumber: "AI-101" }),
    );

    const res = await request.get("/api/travel/travelServices");

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array").with.lengthOf(2);
    expect(res.body[0]).to.have.property("operatorName");
    expect(res.body[0]).to.have.property("bookedSeats"); // populated
  });

  it("should filter by type", async () => {
    await TravelService.create(sampleService({ type: "flight" }));
    await TravelService.create(
      sampleService({
        type: "train",
        operatorName: "Rajdhani",
        serviceNumber: "RJ-001",
      }),
    );

    const res = await request.get("/api/travel/travelServices?type=train");

    expect(res.status).to.equal(200);
    expect(res.body).to.have.lengthOf(1);
    expect(res.body[0].type).to.equal("train");
  });

  it("should filter by from and to", async () => {
    await TravelService.create(sampleService({ from: "Mumbai", to: "Delhi" }));
    await TravelService.create(
      sampleService({
        from: "Chennai",
        to: "Bangalore",
        serviceNumber: "AI-202",
      }),
    );

    const res = await request.get(
      "/api/travel/travelServices?from=Mumbai&to=Delhi",
    );

    expect(res.status).to.equal(200);
    expect(res.body).to.have.lengthOf(1);
    expect(res.body[0].from).to.equal("Mumbai");
  });

  it("should NOT return inactive services", async () => {
    await TravelService.create(sampleService({ isActive: false }));

    const res = await request.get("/api/travel/travelServices");

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array").that.is.empty;
  });

  it("should return empty array when no services exist", async () => {
    const res = await request.get("/api/travel/travelServices");

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/travel/locations
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/travel/locations", () => {
  it("should return all locations", async () => {
    await Location.create({
      type: "flight",
      name: "Chhatrapati Shivaji Intl",
      city: "Mumbai",
      code: "BOM",
    });
    await Location.create({
      type: "flight",
      name: "Indira Gandhi Intl",
      city: "Delhi",
      code: "DEL",
    });

    const res = await request.get("/api/travel/locations");

    expect(res.status).to.equal(200);
    expect(res.body).to.have.lengthOf(2);
  });

  it("should filter by type", async () => {
    await Location.create({
      type: "flight",
      name: "BOM Airport",
      city: "Mumbai",
      code: "BOM",
    });
    await Location.create({
      type: "train",
      name: "Mumbai Central",
      city: "Mumbai",
      code: "BCT",
    });

    const res = await request.get("/api/travel/locations?type=train");

    expect(res.status).to.equal(200);
    expect(res.body).to.have.lengthOf(1);
    expect(res.body[0].type).to.equal("train");
  });

  it("should search by query string (q)", async () => {
    await Location.create({
      type: "flight",
      name: "BOM Airport",
      city: "Mumbai",
      code: "BOM",
    });
    await Location.create({
      type: "flight",
      name: "DEL Airport",
      city: "Delhi",
      code: "DEL",
    });

    const res = await request.get("/api/travel/locations?q=mumbai");

    expect(res.status).to.equal(200);
    expect(res.body).to.have.lengthOf(1);
    expect(res.body[0].city).to.equal("Mumbai");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/travel/boardingPoints
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/travel/boardingPoints", () => {
  it("should return boarding points for a service", async () => {
    const serviceId = new mongoose.Types.ObjectId();
    await BoardingPoint.create({
      serviceId,
      type: "boarding",
      name: "Andheri East",
      time: "05:30",
      landmark: "Near Metro",
    });
    await BoardingPoint.create({
      serviceId,
      type: "drop",
      name: "Connaught Place",
      time: "08:30",
    });

    const res = await request.get(
      `/api/travel/boardingPoints?serviceId=${serviceId}`,
    );

    expect(res.status).to.equal(200);
    expect(res.body).to.have.lengthOf(2);
  });

  it("should filter by type (boarding/drop)", async () => {
    const serviceId = new mongoose.Types.ObjectId();
    await BoardingPoint.create({
      serviceId,
      type: "boarding",
      name: "Point A",
    });
    await BoardingPoint.create({ serviceId, type: "drop", name: "Point B" });

    const res = await request.get(
      `/api/travel/boardingPoints?serviceId=${serviceId}&type=boarding`,
    );

    expect(res.status).to.equal(200);
    expect(res.body).to.have.lengthOf(1);
    expect(res.body[0].type).to.equal("boarding");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/travel/bookedSeats
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/travel/bookedSeats", () => {
  it("should return booked seats for a service", async () => {
    const serviceId = new mongoose.Types.ObjectId();
    await BookedSeat.create({
      serviceId,
      seatId: "12A",
      gender: "male",
      bookingReference: "PNR-001",
    });
    await BookedSeat.create({
      serviceId,
      seatId: "12B",
      gender: "female",
      bookingReference: "PNR-001",
    });

    const res = await request.get(
      `/api/travel/bookedSeats?serviceId=${serviceId}`,
    );

    expect(res.status).to.equal(200);
    expect(res.body).to.have.lengthOf(2);
  });

  it("should return empty array when no seats booked", async () => {
    const serviceId = new mongoose.Types.ObjectId();

    const res = await request.get(
      `/api/travel/bookedSeats?serviceId=${serviceId}`,
    );

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array").that.is.empty;
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/travel/travelBookings  (PNR lookup)
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/travel/travelBookings", () => {
  it("should find booking by bookingReference", async () => {
    await TravelBooking.create({
      userId: "user_123",
      serviceId: "svc_456",
      bookingReference: "PNR-UNIQUE-99",
      passengers: [
        {
          firstName: "Test",
          lastName: "User",
          idType: "aadhaar",
          idNumber: "1111",
        },
      ],
    });

    const res = await request.get(
      "/api/travel/travelBookings?bookingReference=PNR-UNIQUE-99",
    );

    expect(res.status).to.equal(200);
    expect(res.body).to.have.lengthOf(1);
    expect(res.body[0].bookingReference).to.equal("PNR-UNIQUE-99");
  });

  it("should return empty array for non-existent PNR", async () => {
    const res = await request.get(
      "/api/travel/travelBookings?bookingReference=NOPE",
    );

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array").that.is.empty;
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/travel/travelBookings  (protected)
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/travel/travelBookings", () => {
  it("should create a travel booking (authenticated)", async () => {
    const { user, token } = await createAuthenticatedUser();
    const service = await TravelService.create(sampleService());
    const body = sampleBookingBody(service._id);

    const res = await request
      .post("/api/travel/travelBookings")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).to.equal(201);
    expect(res.body.bookingReference).to.equal(body.bookingReference);
    expect(res.body.userId).to.equal(user._id.toString());
    expect(res.body.bookingStatus).to.equal("confirmed");
    expect(res.body.passengers).to.have.lengthOf(1);
    expect(res.body.passengers[0].firstName).to.equal("Ravi");
  });

  it("should return 401 without auth", async () => {
    const res = await request
      .post("/api/travel/travelBookings")
      .send(sampleBookingBody("fake"));

    expect(res.status).to.equal(401);
  });

  it("should return 400 when serviceId is missing", async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request
      .post("/api/travel/travelBookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookingReference: "PNR-X",
        passengers: [
          { firstName: "A", lastName: "B", idType: "x", idNumber: "1" },
        ],
      });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.include("serviceId");
  });

  it("should return 400 when passengers array is empty", async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request
      .post("/api/travel/travelBookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ serviceId: "svc_1", bookingReference: "PNR-Y", passengers: [] });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.include("passenger");
  });

  it("should return 400 when passenger is missing idType", async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request
      .post("/api/travel/travelBookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        serviceId: "svc_1",
        bookingReference: "PNR-Z",
        passengers: [{ firstName: "A", lastName: "B" }],
      });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.include("idType");
  });

  it("should return 409 for duplicate bookingReference", async () => {
    const { token } = await createAuthenticatedUser();
    const service = await TravelService.create(sampleService());
    const body = sampleBookingBody(service._id);

    // First booking
    await request
      .post("/api/travel/travelBookings")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    // Duplicate
    const res = await request
      .post("/api/travel/travelBookings")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).to.equal(409);
    expect(res.body.message).to.include("Duplicate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/travel/bookedSeats  (protected)
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/travel/bookedSeats", () => {
  it("should save a booked seat", async () => {
    const { token } = await createAuthenticatedUser();
    const serviceId = new mongoose.Types.ObjectId();

    const res = await request
      .post("/api/travel/bookedSeats")
      .set("Authorization", `Bearer ${token}`)
      .send({
        serviceId: serviceId.toString(),
        seatId: "14A",
        bookingReference: "PNR-SEAT-1",
        gender: "female",
      });

    expect(res.status).to.equal(201);
    expect(res.body.seatId).to.equal("14A");
    expect(res.body.gender).to.equal("female");
  });

  it("should return 400 when seatId is missing", async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request
      .post("/api/travel/bookedSeats")
      .set("Authorization", `Bearer ${token}`)
      .send({
        serviceId: new mongoose.Types.ObjectId().toString(),
        bookingReference: "PNR-X",
      });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.include("seatId");
  });

  it("should return 401 without auth", async () => {
    const res = await request
      .post("/api/travel/bookedSeats")
      .send({ serviceId: "x", seatId: "1A", bookingReference: "PNR-X" });

    expect(res.status).to.equal(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/travel/travelServices/:id  (update available seats)
// ═══════════════════════════════════════════════════════════════════════════════
describe("PATCH /api/travel/travelServices/:id", () => {
  it("should update availableSeats", async () => {
    const { token } = await createAuthenticatedUser();
    const service = await TravelService.create(
      sampleService({ availableSeats: 100 }),
    );

    const res = await request
      .patch(`/api/travel/travelServices/${service._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ availableSeats: 98 });

    expect(res.status).to.equal(200);
    expect(res.body.availableSeats).to.equal(98);
  });

  it("should return 404 for non-existent service", async () => {
    const { token } = await createAuthenticatedUser();
    const fakeId = randomObjectId();

    const res = await request
      .patch(`/api/travel/travelServices/${fakeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ availableSeats: 50 });

    expect(res.status).to.equal(404);
  });

  it("should return 401 without auth", async () => {
    const service = await TravelService.create(sampleService());

    const res = await request
      .patch(`/api/travel/travelServices/${service._id}`)
      .send({ availableSeats: 50 });

    expect(res.status).to.equal(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/travel/travelBookings/:id/cancel  (cancel booking + refund)
// ═══════════════════════════════════════════════════════════════════════════════
describe("PATCH /api/travel/travelBookings/:id/cancel", () => {
  it("should cancel a confirmed booking", async () => {
    const { user, token } = await createAuthenticatedUser();

    const service = await TravelService.create(sampleService());

    const booking = await TravelBooking.create({
      userId: user._id.toString(),
      serviceId: service._id.toString(),
      bookingReference: "PNR-CANCEL-1",
      bookingStatus: "confirmed",
      paymentMethod: "wallet",
      pricing: { totalAmount: 5000 },
      passengers: [
        {
          firstName: "A",
          lastName: "B",
          idType: "x",
          idNumber: "1",
          seatNumber: "10A",
        },
      ],
    });

    // Create wallet so refund works
    await Wallet.create({
      userId: user._id,
      balance: 0,
      currency: "INR",
      transactions: [],
    });

    const res = await request
      .patch(`/api/travel/travelBookings/${booking._id}/cancel`)
      .set("Authorization", `Bearer ${token}`)
      .send({ cancellationReason: "Change of plans" });

    if (res.status !== 200) console.log("CANCEL ERR:", res.body);

    expect(res.status).to.equal(200);
    expect(res.body.bookingStatus).to.equal("cancelled");
    expect(res.body.paymentStatus).to.equal("refunded");
    expect(res.body.cancellationReason).to.equal("Change of plans");
  });

  it("should refund wallet on cancellation", async () => {
    const { user, token } = await createAuthenticatedUser();

    const service2 = await TravelService.create(
      sampleService({ serviceNumber: "REF-1" }),
    );

    const booking = await TravelBooking.create({
      userId: user._id.toString(),
      serviceId: service2._id.toString(),
      bookingReference: "PNR-REFUND-1",
      bookingStatus: "confirmed",
      paymentMethod: "wallet",
      pricing: { totalAmount: 3000 },
      passengers: [
        { firstName: "X", lastName: "Y", idType: "pan", idNumber: "ABC" },
      ],
    });

    await Wallet.create({
      userId: user._id,
      balance: 1000,
      currency: "INR",
      transactions: [],
    });

    await request
      .patch(`/api/travel/travelBookings/${booking._id}/cancel`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    // Verify wallet was refunded
    const wallet = await Wallet.findOne({ userId: user._id });
    expect(wallet.balance).to.equal(4000); // 1000 + 3000
    expect(wallet.transactions).to.have.lengthOf(1);
    expect(wallet.transactions[0].type).to.equal("refund");
    expect(wallet.transactions[0].amount).to.equal(3000);
  });

  it("should return 400 if booking is already cancelled", async () => {
    const { user, token } = await createAuthenticatedUser();

    const service3 = await TravelService.create(
      sampleService({ serviceNumber: "CAN-2" }),
    );

    const booking = await TravelBooking.create({
      userId: user._id.toString(),
      serviceId: service3._id.toString(),
      bookingReference: "PNR-ALREADY-CANCEL",
      bookingStatus: "cancelled",
      passengers: [
        { firstName: "A", lastName: "B", idType: "x", idNumber: "1" },
      ],
    });

    const res = await request
      .patch(`/api/travel/travelBookings/${booking._id}/cancel`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Already cancelled");
  });

  it("should return 404 for non-existent booking", async () => {
    const { token } = await createAuthenticatedUser();
    const fakeId = randomObjectId();

    const res = await request
      .patch(`/api/travel/travelBookings/${fakeId}/cancel`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).to.equal(404);
  });

  it("should return 401 without auth", async () => {
    const fakeId = randomObjectId();

    const res = await request
      .patch(`/api/travel/travelBookings/${fakeId}/cancel`)
      .send({});

    expect(res.status).to.equal(401);
  });
});
