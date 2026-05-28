/**
 * ─── Booking Controller Tests ────────────────────────────────────────────────
 * Covers: booking.controller.js  &  booking.routes.js
 */

import { expect } from 'chai';
import express from 'express';
import passport from 'passport';
import supertest from 'supertest';
import mongoose from 'mongoose';
import configurePassport from '../src/config/passport.js';
import { bookingRoutes } from '../src/routes/booking.routes.js';
import HotelBooking from '../src/models/hotelBooking.model.js';
import TravelBooking from '../src/models/travelBooking.model.js';
import {
  createAuthenticatedUser,
  createAdminUser,
} from './helpers/testHelper.mjs';

let app, request;

before(async function () {
  this.timeout(30000);
  configurePassport();

  app = express();
  app.use(express.json());
  app.use(passport.initialize());
  app.use('/api/bookings', bookingRoutes);

  request = supertest(app);
});

// helpers

const sampleHotelBooking = (userId) => ({
  userId: userId ?? new mongoose.Types.ObjectId(),
  hotelId: new mongoose.Types.ObjectId(),
  hotelName: 'Grand Hotel',
  checkIn: '2025-12-01',
  checkOut: '2025-12-05',
  numNights: 4,
  numAdults: 2,
  pricing: {
    totalAmount: 8000,
    baseAmount: 7000,
    taxAmount: 1000,
    taxPercent: 14,
  },
  bookingReference: `BKH-${Date.now()}`,
  bookingStatus: 'confirmed',
  paymentStatus: 'paid',
  paymentMethod: 'card',
  source: 'website',
  roomSnapshot: { roomType: 'deluxe', bedType: 'king', pricePerNight: 2000 },
});

const sampleTravelBooking = (userId) => ({
  userId: userId ?? new mongoose.Types.ObjectId().toString(),
  serviceId: new mongoose.Types.ObjectId().toString(),
  bookingReference: `BKT-${Date.now()}`,
  passengers: [
    { name: 'Alice', age: 30, idType: 'passport', idNumber: 'P12345' },
  ],
  seatsBooked: [{ seatId: 'S1', seatNumber: '10A' }],
  pricing: {
    totalAmount: 3500,
    baseAmount: 3000,
    taxAmount: 500,
    taxPercent: 16,
  },
  bookingStatus: 'confirmed',
  paymentStatus: 'paid',
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/bookings/hotel  (admin)
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/bookings/hotel (admin)', () => {
  it('should return all hotel bookings for admin', async () => {
    const { token } = await createAdminUser();
    await HotelBooking.create(sampleHotelBooking());

    const res = await request
      .get('/api/bookings/hotel')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array').with.lengthOf.at.least(1);
  });

  it('should return 403 for non-admin', async () => {
    const { token } = await createAuthenticatedUser();
    const res = await request
      .get('/api/bookings/hotel')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/bookings/hotel
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/bookings/hotel', () => {
  it('should create a hotel booking for authenticated user', async () => {
    const { user, token } = await createAuthenticatedUser();
    const payload = sampleHotelBooking(user._id);

    const res = await request
      .post('/api/bookings/hotel')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).to.equal(201);
    expect(res.body.bookingReference).to.equal(payload.bookingReference);
  });

  it('should return 401 without auth', async () => {
    const res = await request
      .post('/api/bookings/hotel')
      .send(sampleHotelBooking());
    expect(res.status).to.equal(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/bookings/hotel/:id
// ═══════════════════════════════════════════════════════════════════════════════
describe('PATCH /api/bookings/hotel/:id', () => {
  it('should update a hotel booking', async () => {
    const { user, token } = await createAuthenticatedUser();
    const booking = await HotelBooking.create(sampleHotelBooking(user._id));

    const res = await request
      .patch(`/api/bookings/hotel/${booking._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ specialRequests: 'Late check-in' });

    expect(res.status).to.equal(200);
    expect(res.body.specialRequests).to.equal('Late check-in');
  });

  it('should return 404 for non-existent booking', async () => {
    const { token } = await createAuthenticatedUser();
    const res = await request
      .patch(`/api/bookings/hotel/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ specialRequests: 'x' });
    expect(res.status).to.equal(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/bookings/travel  (admin)
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/bookings/travel (admin)', () => {
  it('should return all travel bookings for admin', async () => {
    const { token } = await createAdminUser();
    await TravelBooking.create(sampleTravelBooking());

    const res = await request
      .get('/api/bookings/travel')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
  });

  it('should return 403 for non-admin', async () => {
    const { token } = await createAuthenticatedUser();
    const res = await request
      .get('/api/bookings/travel')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/bookings/hotel/user/:userId
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/bookings/hotel/user/:userId', () => {
  it('should return hotel bookings for a specific user', async () => {
    const { user, token } = await createAuthenticatedUser();
    await HotelBooking.create(sampleHotelBooking(user._id));

    const res = await request
      .get(`/api/bookings/hotel/user/${user._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array').with.lengthOf.at.least(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/bookings/travel/user/:userId
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/bookings/travel/user/:userId', () => {
  it('should return travel bookings for a specific user', async () => {
    const { user, token } = await createAuthenticatedUser();
    await TravelBooking.create(sampleTravelBooking(user._id.toString()));

    const res = await request
      .get(`/api/bookings/travel/user/${user._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/bookings/user/:userId  (combined)
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/bookings/user/:userId (combined)', () => {
  it('should return combined bookings for a user', async () => {
    const { user, token } = await createAuthenticatedUser();
    await HotelBooking.create(sampleHotelBooking(user._id));

    const res = await request
      .get(`/api/bookings/user/${user._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
  });

  it('should return 401 without auth', async () => {
    const res = await request.get(
      `/api/bookings/user/${new mongoose.Types.ObjectId()}`,
    );
    expect(res.status).to.equal(401);
  });
});
