/**
 * ─── Hotel Catalog Controller Tests ─────────────────────────────────────────
 * Covers: hotelCatalog.controller.js  &  hotelCatalog.routes.js
 */

import { expect } from 'chai';
import express from 'express';
import passport from 'passport';
import supertest from 'supertest';
import mongoose from 'mongoose';
import configurePassport from '../src/config/passport.js';
import { hotelCatalogRoutes } from '../src/routes/hotelCatalog.routes.js';
import Hotel from '../src/models/hotel/Hotel.js';
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
  app.use('/api/hotel-catalog', hotelCatalogRoutes);

  request = supertest(app);
});

const sampleHotel = (overrides = {}) => ({
  name: `Hotel ${Date.now()}`,
  hotelType: 'luxury',
  location: {
    city: 'Goa',
    state: 'Goa',
    country: 'India',
    coordinates: { lat: 15.4, lng: 73.8 },
  },
  starRating: 4,
  marketRate: 7000,
  images: ['https://example.com/goa.jpg'],
  amenities: ['wifi', 'pool'],
  description: 'Beach resort.',
  isActive: true,
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/hotel-catalog/meta
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/hotel-catalog/meta', () => {
  it('should return cities, amenities and hotelTypes', async () => {
    await Hotel.create(sampleHotel());

    const res = await request.get('/api/hotel-catalog/meta');

    expect(res.status).to.equal(200);
    expect(res.body).to.have.all.keys('cities', 'amenities', 'hotelTypes');
    expect(res.body.cities).to.include('Goa');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/hotel-catalog  (search / filter)
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/hotel-catalog', () => {
  it('should return all active hotels', async () => {
    await Hotel.create(sampleHotel());

    const res = await request.get('/api/hotel-catalog');

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array').with.lengthOf.at.least(1);
  });

  it('should filter by city', async () => {
    await Hotel.create(
      sampleHotel({
        location: {
          city: 'Manali',
          state: 'HP',
          country: 'India',
          coordinates: { lat: 32, lng: 77 },
        },
        name: `Manali-${Date.now()}`,
      }),
    );

    const res = await request.get('/api/hotel-catalog?city=Manali');

    expect(res.status).to.equal(200);
    expect(res.body.every((h) => h.location.city === 'Manali')).to.be.true;
  });

  it('should filter by starRating', async () => {
    await Hotel.create(
      sampleHotel({ starRating: 5, name: `Star5-${Date.now()}` }),
    );

    const res = await request.get('/api/hotel-catalog?starRating=5');

    expect(res.status).to.equal(200);
    expect(res.body.every((h) => h.starRating === 5)).to.be.true;
  });

  it('should filter by amenities', async () => {
    await Hotel.create(
      sampleHotel({ amenities: ['spa', 'gym'], name: `Spa-${Date.now()}` }),
    );

    const res = await request.get('/api/hotel-catalog?amenities=spa,gym');

    expect(res.status).to.equal(200);
    expect(res.body.length).to.be.at.least(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/hotel-catalog/:id
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/hotel-catalog/:id', () => {
  it('should return hotel by id', async () => {
    const hotel = await Hotel.create(sampleHotel());

    const res = await request.get(`/api/hotel-catalog/${hotel._id}`);

    expect(res.status).to.equal(200);
    expect(res.body._id).to.equal(hotel._id.toString());
  });

  it('should return 404 for unknown id', async () => {
    const res = await request.get(
      `/api/hotel-catalog/${new mongoose.Types.ObjectId()}`,
    );
    expect(res.status).to.equal(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/hotel-catalog  (admin create)
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/hotel-catalog', () => {
  it('should create a hotel as admin', async () => {
    const { token } = await createAdminUser();

    const res = await request
      .post('/api/hotel-catalog')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleHotel({ name: `NewHotel-${Date.now()}` }));

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('_id');
  });

  it('should return 403 for non-admin', async () => {
    const { token } = await createAuthenticatedUser();
    const res = await request
      .post('/api/hotel-catalog')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleHotel());
    expect(res.status).to.equal(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/hotel-catalog/:id  (admin update)
// ═══════════════════════════════════════════════════════════════════════════════
describe('PATCH /api/hotel-catalog/:id', () => {
  it('should update a hotel as admin', async () => {
    const { token } = await createAdminUser();
    const hotel = await Hotel.create(sampleHotel());

    const res = await request
      .patch(`/api/hotel-catalog/${hotel._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ starRating: 3 });

    expect(res.status).to.equal(200);
    expect(res.body.starRating).to.equal(3);
  });

  it('should return 404 for unknown hotel', async () => {
    const { token } = await createAdminUser();
    const res = await request
      .patch(`/api/hotel-catalog/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ starRating: 3 });
    expect(res.status).to.equal(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/hotel-catalog/validate-coupon
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/hotel-catalog/validate-coupon', () => {
  it('should return invalid for unknown coupon code', async () => {
    const res = await request
      .post('/api/hotel-catalog/validate-coupon')
      .send({
        couponCode: 'NOEXIST',
        hotelId: new mongoose.Types.ObjectId(),
        roomType: 'deluxe',
        nights: 3,
      });

    expect(res.status).to.equal(200);
    expect(res.body.valid).to.be.false;
  });

  it('should return 400 when couponCode is missing', async () => {
    const res = await request
      .post('/api/hotel-catalog/validate-coupon')
      .send({
        hotelId: new mongoose.Types.ObjectId(),
        roomType: 'deluxe',
        nights: 2,
      });

    expect(res.status).to.equal(400);
  });
});
