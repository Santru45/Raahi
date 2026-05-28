/**
 * ─── Dashboard Controller Tests ──────────────────────────────────────────────
 * Covers: dashboard.controller.js  &  dashboard.routes.js
 */

import { expect } from 'chai';
import express from 'express';
import passport from 'passport';
import supertest from 'supertest';
import mongoose from 'mongoose';
import configurePassport from '../src/config/passport.js';
import { dashboardRoutes } from '../src/routes/dashboard.routes.js';
import HotelBooking from '../src/models/hotelBooking.model.js';
import TravelBooking from '../src/models/travelBooking.model.js';
import {
  createAdminUser,
  createAuthenticatedUser,
} from './helpers/testHelper.mjs';

let app, request;

before(async function () {
  this.timeout(30000);
  configurePassport();

  app = express();
  app.use(express.json());
  app.use(passport.initialize());
  // dashboard controller uses req.app.locals is not needed here but mongoose connection is
  app.use('/api/admin', dashboardRoutes);

  request = supertest(app);
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/stats
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/admin/stats', () => {
  it('should return dashboard stats for admin', async () => {
    const { token } = await createAdminUser();

    const res = await request
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('totalUsers');
    expect(res.body).to.have.property('totalBookings');
    expect(res.body).to.have.property('revenue');
  });

  it('should return 403 for non-admin', async () => {
    const { token } = await createAuthenticatedUser();
    const res = await request
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(403);
  });

  it('should return 401 without auth', async () => {
    const res = await request.get('/api/admin/stats');
    expect(res.status).to.equal(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/recent-bookings
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/admin/recent-bookings', () => {
  it('should return recent bookings for admin', async () => {
    const { token } = await createAdminUser();

    // seed a hotel booking
    await HotelBooking.create({
      userId: new mongoose.Types.ObjectId(),
      hotelId: new mongoose.Types.ObjectId(),
      hotelName: 'Test Hotel',
      checkIn: '2025-11-01',
      checkOut: '2025-11-04',
      numNights: 3,
      numAdults: 2,
      pricing: {
        totalAmount: 6000,
        baseAmount: 5000,
        taxAmount: 1000,
        taxPercent: 20,
      },
      bookingReference: `BKRB-${Date.now()}`,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'card',
      source: 'website',
      roomSnapshot: {
        roomType: 'standard',
        bedType: 'double',
        pricePerNight: 2000,
      },
    });

    const res = await request
      .get('/api/admin/recent-bookings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
  });

  it('should return 403 for non-admin', async () => {
    const { token } = await createAuthenticatedUser();
    const res = await request
      .get('/api/admin/recent-bookings')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/top-hotels
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/admin/top-hotels', () => {
  it('should return top hotels for admin', async () => {
    const { token } = await createAdminUser();

    const res = await request
      .get('/api/admin/top-hotels')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
  });

  it('should return 403 for non-admin', async () => {
    const { token } = await createAuthenticatedUser();
    const res = await request
      .get('/api/admin/top-hotels')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(403);
  });
});
