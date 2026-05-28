/**
 * ─── Room & Rate Plan Controller Tests ───────────────────────────────────────
 * Covers: room.controller.js  &  room.routes.js
 *         Also exercises: Room.js, RatePlan.js models
 */

import { expect } from 'chai';
import express from 'express';
import passport from 'passport';
import supertest from 'supertest';
import mongoose from 'mongoose';
import configurePassport from '../src/config/passport.js';
import { roomRouter, ratePlanRouter } from '../src/routes/room.routes.js';
import Room from '../src/models/hotel/Room.js';
import RatePlan from '../src/models/hotel/RatePlan.js';
import HotelBooking from '../src/models/hotel/HotelBooking.js';
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
  app.use('/api/rooms', roomRouter);
  app.use('/api/rate-plans', ratePlanRouter);

  request = supertest(app);
});

const newHotelId = () => new mongoose.Types.ObjectId();

const sampleRoom = (hotelId) => ({
  hotelId: hotelId ?? newHotelId(),
  roomNumber: `R${Date.now()}`,
  type: 'deluxe',
  bedType: 'king',
  maxOccupancy: 2,
  basePricePerNight: 2500,
  status: 'available',
  amenities: ['wifi'],
  images: [],
});

const sampleRatePlan = (hotelId) => ({
  hotelId: hotelId ?? newHotelId(),
  planName: 'EP Plan',
  includesBreakfast: false,
  isRefundable: true,
  freeCancellationHours: 24,
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/rooms
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/rooms', () => {
  it('should return all rooms (no filter)', async () => {
    const hotelId = newHotelId();
    await Room.create(sampleRoom(hotelId));

    const res = await request.get('/api/rooms');
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array').with.lengthOf.at.least(1);
  });

  it('should filter rooms by hotelId', async () => {
    const hotelId = newHotelId();
    await Room.create(sampleRoom(hotelId));

    const res = await request.get(`/api/rooms?hotelId=${hotelId}`);
    expect(res.status).to.equal(200);
    expect(res.body.every((r) => r.hotelId === hotelId.toString())).to.be.true;
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/rooms/available
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/rooms/available', () => {
  it('should return available rooms for a hotel', async () => {
    const hotelId = newHotelId();
    await Room.create(sampleRoom(hotelId));

    const res = await request.get(
      `/api/rooms/available?hotelId=${hotelId}&checkIn=2027-01-01&checkOut=2027-01-05`,
    );
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array').with.lengthOf(1);
  });

  it('should exclude rooms with overlapping bookings', async () => {
    const hotelId = newHotelId();
    const room = await Room.create(sampleRoom(hotelId));

    await HotelBooking.create({
      userId: new mongoose.Types.ObjectId(),
      hotelId,
      roomId: room._id,
      hotelName: 'Test',
      checkIn: new Date('2027-02-10'),
      checkOut: new Date('2027-02-14'),
      numNights: 4,
      numAdults: 2,
      pricing: {
        totalAmount: 8000,
        baseAmount: 7000,
        taxAmount: 1000,
        taxPercent: 14,
      },
      bookingReference: `AVAIL-${Date.now()}`,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'card',
      source: 'website',
      roomSnapshot: {
        roomType: 'deluxe',
        bedType: 'king',
        pricePerNight: 2500,
      },
    });

    const res = await request.get(
      `/api/rooms/available?hotelId=${hotelId}&checkIn=2027-02-11&checkOut=2027-02-13`,
    );
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array').with.lengthOf(0);
  });

  it('should return 400 when required params are missing', async () => {
    const res = await request.get('/api/rooms/available?hotelId=abc');
    expect(res.status).to.equal(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/rooms/:id
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/rooms/:id', () => {
  it('should return room by id', async () => {
    const room = await Room.create(sampleRoom());

    const res = await request.get(`/api/rooms/${room._id}`);
    expect(res.status).to.equal(200);
    expect(res.body._id).to.equal(room._id.toString());
  });

  it('should return 404 for unknown room', async () => {
    const res = await request.get(
      `/api/rooms/${new mongoose.Types.ObjectId()}`,
    );
    expect(res.status).to.equal(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/rooms  (admin)
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/rooms', () => {
  it('should create a room as admin', async () => {
    const { token } = await createAdminUser();
    const hotelId = newHotelId();

    const res = await request
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleRoom(hotelId));

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('_id');
  });

  it('should return 403 for non-admin', async () => {
    const { token } = await createAuthenticatedUser();
    const res = await request
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleRoom());
    expect(res.status).to.equal(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/rooms/:id/status
// ═══════════════════════════════════════════════════════════════════════════════
describe('PATCH /api/rooms/:id/status', () => {
  it('should update room status as admin', async () => {
    const { token } = await createAdminUser();
    const room = await Room.create(sampleRoom());

    const res = await request
      .patch(`/api/rooms/${room._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'maintenance' });

    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('maintenance');
  });

  it('should return 404 for unknown room', async () => {
    const { token } = await createAdminUser();
    const res = await request
      .patch(`/api/rooms/${new mongoose.Types.ObjectId()}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'available' });
    expect(res.status).to.equal(404);
  });

  it('should return 401 without auth', async () => {
    const res = await request
      .patch(`/api/rooms/${new mongoose.Types.ObjectId()}/status`)
      .send({ status: 'available' });
    expect(res.status).to.equal(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/rate-plans
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/rate-plans', () => {
  it('should return rate plans for a hotel', async () => {
    const hotelId = newHotelId();
    await RatePlan.create(sampleRatePlan(hotelId));

    const res = await request.get(`/api/rate-plans?hotelId=${hotelId}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array').with.lengthOf(1);
  });

  it('should return 400 when hotelId is missing', async () => {
    const res = await request.get('/api/rate-plans');
    expect(res.status).to.equal(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/rate-plans  (admin)
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/rate-plans', () => {
  it('should create a rate plan as admin', async () => {
    const { token } = await createAdminUser();
    const hotelId = newHotelId();

    const res = await request
      .post('/api/rate-plans')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleRatePlan(hotelId));

    expect(res.status).to.equal(201);
    expect(res.body.planName).to.equal('EP Plan');
  });

  it('should return 403 for non-admin', async () => {
    const { token } = await createAuthenticatedUser();
    const res = await request
      .post('/api/rate-plans')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleRatePlan());
    expect(res.status).to.equal(403);
  });
});
