/**
 * ─── Wallet API Tests ───────────────────────────────────────────────────────
 */

import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";
import express from "express";
import passport from "passport";
import supertest from "supertest";
import configurePassport from "../src/config/passport.js";
import { walletRoutes } from "../src/routes/wallet.routes.js";
import Wallet from "../src/models/wallet.model.js";
import { createAuthenticatedUser } from "./helpers/testHelper.mjs";

let app, request;

before(async function () {
  this.timeout(30000);
  configurePassport();

  app = express();
  app.use(express.json());
  app.use(passport.initialize());
  app.use("/api/wallets", walletRoutes);

  request = supertest(app);
});

afterEach(() => {
  sinon.restore();
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/wallets/:userId
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/wallets/:userId", () => {
  it("should return existing wallet for user", async () => {
    const { user, token } = await createAuthenticatedUser();

    // Pre-create wallet
    await Wallet.create({
      userId: user._id,
      balance: 500,
      currency: "INR",
      transactions: [],
    });

    const res = await request
      .get(`/api/wallets/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.balance).to.equal(500);
    expect(res.body.currency).to.equal("INR");
  });

  it("should auto-create wallet if none exists", async () => {
    const { user, token } = await createAuthenticatedUser();

    const res = await request
      .get(`/api/wallets/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.balance).to.equal(0);
  });

  it("should return 401 without auth", async () => {
    const { user } = await createAuthenticatedUser();

    const res = await request.get(`/api/wallets/${user._id}`);

    expect(res.status).to.equal(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/wallets/:walletId
// ═══════════════════════════════════════════════════════════════════════════════
describe("PUT /api/wallets/:walletId", () => {
  it("should update wallet balance", async () => {
    const { user, token } = await createAuthenticatedUser();
    const wallet = await Wallet.create({
      userId: user._id,
      balance: 100,
      currency: "INR",
      transactions: [],
    });

    const res = await request
      .put(`/api/wallets/${wallet._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ balance: 250 });

    expect(res.status).to.equal(200);
    expect(res.body.balance).to.equal(250);
  });

  it("should add transaction to wallet", async () => {
    const { user, token } = await createAuthenticatedUser();
    const wallet = await Wallet.create({
      userId: user._id,
      balance: 1000,
      currency: "INR",
      transactions: [],
    });

    const res = await request
      .put(`/api/wallets/${wallet._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        balance: 800,
        transactions: [
          {
            type: "debit",
            amount: 200,
            description: "Hotel booking",
            date: new Date().toISOString(),
          },
        ],
      });

    expect(res.status).to.equal(200);
    expect(res.body.balance).to.equal(800);
    expect(res.body.transactions).to.have.lengthOf(1);
    expect(res.body.transactions[0].type).to.equal("debit");
  });

  it("should return 404 for non-existent wallet", async () => {
    const { token } = await createAuthenticatedUser();
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request
      .put(`/api/wallets/${fakeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ balance: 999 });

    expect(res.status).to.equal(404);
  });
});
