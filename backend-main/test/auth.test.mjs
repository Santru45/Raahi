/**
 * ─── Auth API Tests ─────────────────────────────────────────────────────────
 *
 * Tools used:
 *   Mocha   – test runner  (describe, it, before, after)
 *   Chai    – assertions   (expect / should)
 *   Sinon   – spies & stubs
 *   Supertest – HTTP request simulation
 *
 * These tests hit the Express routes via Supertest against an in-memory MongoDB.
 */

import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";
// Build a minimal Express app with only the auth routes
import express from "express";
import passport from "passport";
import configurePassport from "../src/config/passport.js";
import { authRoutes } from "../src/routes/auth.routes.js";

let app;

// We use dynamic import for supertest (ESM compat)
let request;

before(async function () {
  this.timeout(30000);
  process.env.JWT_EXPIRES_IN = "1h";
  configurePassport();

  app = express();
  app.use(express.json());
  app.use(passport.initialize());
  app.use("/api/auth", authRoutes);

  const supertest = await import("supertest");
  request = supertest.default(app);
});

afterEach(() => {
  sinon.restore();
});

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNUP
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/auth/signup", () => {
  const validUser = {
    name: "John Doe",
    email: "john@example.com",
    passwordHash: "Secret1!",
    phone: "9876543210",
  };

  it("should create a new user and return 201", async () => {
    const res = await request.post("/api/auth/signup").send(validUser);

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property("token");
    expect(res.body).to.have.property("user");
    expect(res.body.user.name).to.equal("John Doe");
    expect(res.body.user.email).to.equal("john@example.com");
    expect(res.body.user.role).to.equal("customer");
  });

  it("should NOT return passwordHash in response", async () => {
    const res = await request.post("/api/auth/signup").send(validUser);

    expect(res.body.user).to.not.have.property("passwordHash");
  });

  it("should return 409 if email already exists", async () => {
    // First signup
    await request.post("/api/auth/signup").send(validUser);
    // Duplicate signup
    const res = await request.post("/api/auth/signup").send(validUser);

    expect(res.status).to.equal(409);
    expect(res.body.message).to.include("already exists");
  });

  it("should return 400 for missing required fields", async () => {
    const res = await request
      .post("/api/auth/signup")
      .send({ email: "no-name@test.com" });

    expect(res.status).to.equal(400);
  });

  it("should create a wallet and loyalty account for the new user", async () => {
    const res = await request.post("/api/auth/signup").send(validUser);
    const userId = res.body.user._id;

    // Check wallet was created
    const Wallet = mongoose.model("Wallet");
    const wallet = await Wallet.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });
    expect(wallet).to.not.be.null;
    expect(wallet.balance).to.equal(0);

    // Check loyalty account was created
    const Loyalty = mongoose.model("LoyaltyAccount");
    const loyalty = await Loyalty.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });
    expect(loyalty).to.not.be.null;
    expect(loyalty.tier).to.equal("bronze");
  });

  it("should generate a valid JWT token", async () => {
    const res = await request.post("/api/auth/signup").send(validUser);
    const token = res.body.token;

    expect(token).to.be.a("string");
    expect(token.split(".")).to.have.lengthOf(3); // JWT has 3 parts
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/auth/login", () => {
  // Register a user before login tests
  beforeEach(async () => {
    await request.post("/api/auth/signup").send({
      name: "Jane Smith",
      email: "jane@example.com",
      passwordHash: "Password1!",
      phone: "9988776655",
    });
  });

  it("should login with correct credentials and return token", async () => {
    const res = await request
      .post("/api/auth/login")
      .send({ email: "jane@example.com", password: "Password1!" });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("token");
    expect(res.body).to.have.property("user");
    expect(res.body.user.email).to.equal("jane@example.com");
  });

  it("should return 404 for unregistered email", async () => {
    const res = await request
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "whatever" });

    expect(res.status).to.equal(404);
    expect(res.body.message).to.equal("Email not registered");
  });

  it("should return 401 for incorrect password", async () => {
    const res = await request
      .post("/api/auth/login")
      .send({ email: "jane@example.com", password: "WrongPassword!" });

    expect(res.status).to.equal(401);
    expect(res.body.message).to.equal("Incorrect Password");
  });

  it("should NOT expose passwordHash in login response", async () => {
    const res = await request
      .post("/api/auth/login")
      .send({ email: "jane@example.com", password: "Password1!" });

    expect(res.body.user).to.not.have.property("passwordHash");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD / OTP FLOW
// ═══════════════════════════════════════════════════════════════════════════════
describe("Forgot Password Flow", () => {
  beforeEach(async () => {
    await request.post("/api/auth/signup").send({
      name: "OTP User",
      email: "otp@example.com",
      passwordHash: "OldPass1!",
      phone: "9123456789",
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    it("should generate OTP for registered email", async () => {
      const res = await request
        .post("/api/auth/forgot-password")
        .send({ email: "otp@example.com" });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("otp");
      expect(res.body.otp).to.be.a("string");
      expect(res.body.otp).to.have.lengthOf(6);
    });

    it("should return 404 for unregistered email", async () => {
      const res = await request
        .post("/api/auth/forgot-password")
        .send({ email: "unknown@example.com" });

      expect(res.status).to.equal(404);
    });
  });

  describe("POST /api/auth/verify-otp", () => {
    it("should verify correct OTP", async () => {
      // Get OTP
      const otpRes = await request
        .post("/api/auth/forgot-password")
        .send({ email: "otp@example.com" });
      const otp = otpRes.body.otp;

      // Verify OTP
      const res = await request
        .post("/api/auth/verify-otp")
        .send({ email: "otp@example.com", otp });

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal("OTP verified");
    });

    it("should reject wrong OTP", async () => {
      // Generate OTP first
      await request
        .post("/api/auth/forgot-password")
        .send({ email: "otp@example.com" });

      const res = await request
        .post("/api/auth/verify-otp")
        .send({ email: "otp@example.com", otp: "000000" });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal("Invalid OTP");
    });
  });

  describe("POST /api/auth/reset-password", () => {
    it("should reset password and allow login with new password", async () => {
      // Get OTP
      const otpRes = await request
        .post("/api/auth/forgot-password")
        .send({ email: "otp@example.com" });
      const otp = otpRes.body.otp;

      // Reset password
      const resetRes = await request.post("/api/auth/reset-password").send({
        email: "otp@example.com",
        otp,
        newPassword: "NewPass1!",
      });
      expect(resetRes.status).to.equal(200);

      // Login with new password
      const loginRes = await request
        .post("/api/auth/login")
        .send({ email: "otp@example.com", password: "NewPass1!" });
      expect(loginRes.status).to.equal(200);
      expect(loginRes.body).to.have.property("token");

      // Old password should fail
      const oldLoginRes = await request
        .post("/api/auth/login")
        .send({ email: "otp@example.com", password: "OldPass1!" });
      expect(oldLoginRes.status).to.equal(401);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SINON DEMOS  (spies & stubs — syllabus requirement)
// ═══════════════════════════════════════════════════════════════════════════════
describe("Sinon Spies & Stubs Demo", () => {
  it("spy — should track function calls without changing behavior", () => {
    const calculator = { add: (a, b) => a + b };

    // Create a spy on the add method
    const spy = sinon.spy(calculator, "add");

    const result = calculator.add(2, 3);

    // Spy tracks calls but the real function still runs
    expect(spy.calledOnce).to.be.true;
    expect(spy.calledWith(2, 3)).to.be.true;
    expect(result).to.equal(5); // original function returned correctly
    expect(spy.returnValues[0]).to.equal(5);
  });

  it("stub — should replace function behavior with fake return", () => {
    const database = {
      findUser: () => {
        throw new Error("Should not hit real DB!");
      },
    };

    // Stub replaces the function — original never runs
    const stub = sinon.stub(database, "findUser").returns({
      _id: "123",
      name: "Stubbed User",
      email: "stub@test.com",
    });

    const user = database.findUser("123");

    // Stub was called, returned fake data, original never ran
    expect(stub.calledOnce).to.be.true;
    expect(user.name).to.equal("Stubbed User");
    expect(user.email).to.equal("stub@test.com");
  });

  it("stub — should fake async database call", async () => {
    const userService = {
      getUserById: async () => {
        throw new Error("Real DB call");
      },
    };

    // Stub to return a resolved promise with fake data
    sinon.stub(userService, "getUserById").resolves({
      _id: "abc",
      name: "Async Stub User",
    });

    const user = await userService.getUserById("abc");
    expect(user.name).to.equal("Async Stub User");
  });

  it("spy — should verify callback was called", () => {
    function processBooking(data, callback) {
      // ... process booking ...
      callback(null, { bookingId: "BK-001", status: "confirmed" });
    }

    const callbackSpy = sinon.spy();
    processBooking({ hotel: "Taj" }, callbackSpy);

    expect(callbackSpy.calledOnce).to.be.true;
    expect(callbackSpy.args[0][0]).to.be.null; // no error
    expect(callbackSpy.args[0][1].status).to.equal("confirmed");
  });
});
