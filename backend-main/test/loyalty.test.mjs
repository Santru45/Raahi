/**
 * ─── Loyalty API Tests ──────────────────────────────────────────────────────
 */

import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";
import express from "express";
import passport from "passport";
import supertest from "supertest";
import configurePassport from "../src/config/passport.js";
import { loyaltyRoutes } from "../src/routes/loyalty.routes.js";
import LoyaltyAccount from "../src/models/loyaltyAccount.model.js";
import { createAuthenticatedUser } from "./helpers/testHelper.mjs";

let app, request;

before(async function () {
  this.timeout(30000);
  configurePassport();

  app = express();
  app.use(express.json());
  app.use(passport.initialize());
  app.use("/api/loyalty", loyaltyRoutes);

  request = supertest(app);
});

afterEach(() => {
  sinon.restore();
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/loyalty/:userId
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/loyalty/:userId", () => {
  it("should return loyalty account", async () => {
    const { user, token } = await createAuthenticatedUser();
    await LoyaltyAccount.create({
      userId: user._id,
      coinBalance: 50,
      totalEarned: 50,
      tier: "bronze",
      earnMultiplier: 1,
      maxRedeemPercent: 10,
      nextTierAt: 200,
      ledger: [],
    });

    const res = await request
      .get(`/api/loyalty/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.coinBalance).to.equal(50);
    expect(res.body.tier).to.equal("bronze");
  });

  it("should auto-create loyalty account if none exists", async () => {
    const { user, token } = await createAuthenticatedUser();

    const res = await request
      .get(`/api/loyalty/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.coinBalance).to.equal(0);
    expect(res.body.tier).to.equal("bronze");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/loyalty/:userId/award
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/loyalty/:userId/award", () => {
  it("should award coins based on booking amount", async () => {
    const { user, token } = await createAuthenticatedUser();
    await LoyaltyAccount.create({
      userId: user._id,
      coinBalance: 0,
      totalEarned: 0,
      tier: "bronze",
      earnMultiplier: 1,
      maxRedeemPercent: 10,
      nextTierAt: 200,
      ledger: [],
    });

    const res = await request
      .post(`/api/loyalty/${user._id}/award`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookingAmount: 5000,
        bookingReference: "BK-001",
        bookingType: "hotel",
      });

    expect(res.status).to.equal(200);
    // 5000 * 0.01 * 1 (bronze multiplier) = 50 coins
    expect(res.body.coinBalance).to.equal(50);
    expect(res.body.totalEarned).to.equal(50);
    expect(res.body.ledger).to.have.lengthOf(1);
    expect(res.body.ledger[0].action).to.equal("earned");
  });

  it("should update tier when threshold is crossed", async () => {
    const { user, token } = await createAuthenticatedUser();
    await LoyaltyAccount.create({
      userId: user._id,
      coinBalance: 190,
      totalEarned: 190,
      tier: "bronze",
      earnMultiplier: 1,
      maxRedeemPercent: 10,
      nextTierAt: 200,
      ledger: [],
    });

    const res = await request
      .post(`/api/loyalty/${user._id}/award`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookingAmount: 2000,
        bookingReference: "BK-002",
        bookingType: "travel",
      });

    // 190 + 20 = 210 → crosses 200 → silver tier
    expect(res.body.tier).to.equal("silver");
    expect(res.body.earnMultiplier).to.equal(1.5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/loyalty/:userId/validate-redeem
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/loyalty/:userId/validate-redeem", () => {
  it("should validate redemption within limits", async () => {
    const { user, token } = await createAuthenticatedUser();
    await LoyaltyAccount.create({
      userId: user._id,
      coinBalance: 100,
      totalEarned: 100,
      tier: "bronze",
      earnMultiplier: 1,
      maxRedeemPercent: 10,
      nextTierAt: 200,
      ledger: [
        {
          _id: "led_001",
          action: "earned",
          coins: 100,
          balanceAfter: 100,
          bookingReference: "BK-X",
          bookingType: "hotel",
        },
      ],
    });

    const res = await request
      .post(`/api/loyalty/${user._id}/validate-redeem`)
      .set("Authorization", `Bearer ${token}`)
      .send({ coinsToRedeem: 5, bookingAmount: 5000 });

    expect(res.status).to.equal(200);
    expect(res.body.valid).to.be.true;
    // discount = 5 * 0.5 = 2.5
    expect(res.body.discountAmount).to.equal(2.5);
  });

  it("should reject when insufficient coins", async () => {
    const { user, token } = await createAuthenticatedUser();
    await LoyaltyAccount.create({
      userId: user._id,
      coinBalance: 5,
      totalEarned: 5,
      tier: "bronze",
      earnMultiplier: 1,
      maxRedeemPercent: 10,
      nextTierAt: 200,
      ledger: [],
    });

    const res = await request
      .post(`/api/loyalty/${user._id}/validate-redeem`)
      .set("Authorization", `Bearer ${token}`)
      .send({ coinsToRedeem: 50, bookingAmount: 5000 });

    expect(res.body.valid).to.be.false;
    expect(res.body.error).to.include("Insufficient");
  });
});
