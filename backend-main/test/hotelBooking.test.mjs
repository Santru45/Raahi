/**
 * ─── Hotel Booking Controller Tests ─────────────────────────────────────────
 * Covers: hotelBooking.controller.js  &  hotelBooking.routes.js
 *         Also exercises: Room, Wallet, LoyaltyAccount models (Inventory, RatePlan, Room)
 */

import { expect } from 'chai';
import express from 'express';
import passport from 'passport';
import supertest from 'supertest';
import mongoose from 'mongoose';
import configurePassport from '../src/config/passport.js';
import { hotelBookingRoutes } from '../src/routes/hotelBooking.routes.js';
import HotelBooking from '../src/models/hotel/HotelBooking.js';
import Room from '../src/models/hotel/Room.js';
import Wallet from '../src/models/wallet.model.js';
import LoyaltyAccount from '../src/models/loyaltyAccount.model.js';
import { createAuthenticatedUser } from './helpers/testHelper.mjs';

let app, request;

before(async function () {
  this.timeout(30000);
  configurePassport();

  app = express();
  app.use(express.json());
  app.use(passport.initialize());
  app.use('/api/hotel-bookings', hotelBookingRoutes);

  request = supertest(app);
});

// ─── helpers ──────────────────────────────────────────────────────────────────

const sampleRoom = (hotelId) => ({
  hotelId: hotelId ?? new mongoose.Types.ObjectId(),
  roomNumber: `R-${Date.now()}`,
  type: 'deluxe',
  bedType: 'king',
  maxOccupancy: 2,
  basePricePerNight: 3000,
  status: 'available',
  amenities: ['wifi'],
  images: [],
});

const sampleBookingPayload = ({ userId, hotelId, roomId } = {}) => ({
  userId: userId?.toString() ?? new mongoose.Types.ObjectId().toString(),
  hotelId: hotelId?.toString() ?? new mongoose.Types.ObjectId().toString(),
  roomId: roomId?.toString() ?? null,
  hotelName: 'Taj Palace',
  checkIn: '2026-09-01',
  checkOut: '2026-09-04',
  numAdults: 2,
  numChildren: 0,
  guests: [{ name: 'Alice', age: 30 }],
  pricing: {
    totalAmount: 9000,
    baseAmount: 8000,
    taxAmount: 1000,
    taxPercent: 12,
  },
  bookingReference: `HBK-${Date.now()}`,
  paymentMethod: 'card',
  source: 'website',
  roomSnapshot: { roomType: 'deluxe', bedType: 'king', pricePerNight: 3000 },
  ratePlanSnapshot: {
    planName: 'EP',
    isRefundable: true,
    freeCancellationHours: 48,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/hotel-bookings
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/hotel-bookings', () => {
  it('should create a hotel booking (authenticated)', async () => {
    const { user, token } = await createAuthenticatedUser();
    const hotelId = new mongoose.Types.ObjectId();
    const room = await Room.create(sampleRoom(hotelId));

    const payload = sampleBookingPayload({
      userId: user._id,
      hotelId,
      roomId: room._id,
    });

    const res = await request
      .post('/api/hotel-bookings')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('bookingReference');
  });

  it('should create booking using rooms[] array', async () => {
    const { user, token } = await createAuthenticatedUser();
    const hotelId = new mongoose.Types.ObjectId();
    const room = await Room.create(sampleRoom(hotelId));

    const payload = {
      ...sampleBookingPayload({ userId: user._id, hotelId }),
      bookingReference: `HBK-${Date.now() + 1}`,
      rooms: [
        {
          roomId: room._id.toString(),
          roomSnapshot: {
            roomType: 'deluxe',
            bedType: 'king',
            pricePerNight: 3000,
          },
          ratePlanSnapshot: { planName: 'EP', isRefundable: true },
        },
      ],
    };

    const res = await request
      .post('/api/hotel-bookings')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).to.equal(201);
  });

  it('should return 401 without auth', async () => {
    const res = await request
      .post('/api/hotel-bookings')
      .send(sampleBookingPayload());
    expect(res.status).to.equal(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/hotel-bookings?userId=
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/hotel-bookings', () => {
  it('should return bookings for the user', async () => {
    const { user, token } = await createAuthenticatedUser();
    const hotelId = new mongoose.Types.ObjectId();
    await HotelBooking.create({
      ...sampleBookingPayload({ userId: user._id, hotelId }),
      bookingReference: `HBK-GET-${Date.now()}`,
    });

    const res = await request
      .get(`/api/hotel-bookings?userId=${user._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
  });

  it('should return 400 when userId is missing', async () => {
    const { token } = await createAuthenticatedUser();
    const res = await request
      .get('/api/hotel-bookings')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(400);
  });

  it('should return 401 without auth', async () => {
    const res = await request.get('/api/hotel-bookings?userId=abc');
    expect(res.status).to.equal(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/hotel-bookings/:id
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/hotel-bookings/:id', () => {
  it('should return booking by id', async () => {
    const { user, token } = await createAuthenticatedUser();
    const hotelId = new mongoose.Types.ObjectId();
    const booking = await HotelBooking.create({
      ...sampleBookingPayload({ userId: user._id, hotelId }),
      bookingReference: `HBK-ID-${Date.now()}`,
    });

    const res = await request
      .get(`/api/hotel-bookings/${booking._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.bookingReference).to.equal(booking.bookingReference);
  });

  it('should return 404 for non-existent booking', async () => {
    const { token } = await createAuthenticatedUser();
    const res = await request
      .get(`/api/hotel-bookings/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/hotel-bookings/:id/cancel
// ═══════════════════════════════════════════════════════════════════════════════
describe('PATCH /api/hotel-bookings/:id/cancel', () => {
  it('should cancel a booking (no refund — within 24h)', async () => {
    const { user, token } = await createAuthenticatedUser();
    const hotelId = new mongoose.Types.ObjectId();

    // checkIn is tomorrow → <24h → 0% refund
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const booking = await HotelBooking.create({
      ...sampleBookingPayload({ userId: user._id, hotelId }),
      checkIn: tomorrow.toISOString().split('T')[0],
      checkOut: dayAfter.toISOString().split('T')[0],
      bookingReference: `HBK-CXL-${Date.now()}`,
    });

    const res = await request
      .patch(`/api/hotel-bookings/${booking._id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ cancellationReason: 'Change of plans' });

    expect(res.status).to.equal(200);
    expect(res.body.bookingStatus).to.equal('cancelled');
    expect(res.body.refundPct).to.equal(0);
  });

  it('should cancel with 100% refund when check-in >= 48h away', async () => {
    const { user, token } = await createAuthenticatedUser();
    const hotelId = new mongoose.Types.ObjectId();

    // seed wallet
    await Wallet.create({
      userId: user._id,
      balance: 10000,
      transactions: [],
    });
    // seed loyalty
    await LoyaltyAccount.create({
      userId: user._id,
      coinBalance: 200,
      tier: 'silver',
      ledger: [],
    });

    const far = new Date();
    far.setDate(far.getDate() + 10);
    const farEnd = new Date(far);
    farEnd.setDate(farEnd.getDate() + 3);

    const booking = await HotelBooking.create({
      ...sampleBookingPayload({ userId: user._id, hotelId }),
      checkIn: far.toISOString().split('T')[0],
      checkOut: farEnd.toISOString().split('T')[0],
      bookingReference: `HBK-RFND-${Date.now()}`,
      paymentMethod: 'wallet',
      coinsEarned: 100,
      coinsRedeemed: 50,
      pricing: {
        totalAmount: 5000,
        baseAmount: 4500,
        taxAmount: 500,
        taxPercent: 11,
      },
    });

    const res = await request
      .patch(`/api/hotel-bookings/${booking._id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ cancellationReason: 'Plans changed' });

    expect(res.status).to.equal(200);
    expect(res.body.refundPct).to.equal(100);
    expect(res.body.refundAmount).to.equal(5000);
  });

  it('should return 404 for non-existent booking', async () => {
    const { token } = await createAuthenticatedUser();
    const res = await request
      .patch(`/api/hotel-bookings/${new mongoose.Types.ObjectId()}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).to.equal(404);
  });

  it('should return 400 if already cancelled', async () => {
    const { user, token } = await createAuthenticatedUser();
    const hotelId = new mongoose.Types.ObjectId();

    const booking = await HotelBooking.create({
      ...sampleBookingPayload({ userId: user._id, hotelId }),
      bookingReference: `HBK-2X-${Date.now()}`,
      bookingStatus: 'cancelled',
    });

    const res = await request
      .patch(`/api/hotel-bookings/${booking._id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).to.equal(400);
  });

  it('should return 401 without auth', async () => {
    const res = await request
      .patch(`/api/hotel-bookings/${new mongoose.Types.ObjectId()}/cancel`)
      .send({});
    expect(res.status).to.equal(401);
  });
});
