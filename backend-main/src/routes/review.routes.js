import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import {
  getReviewsByHotel,
  getReviewByUserAndEntity,
  validateReviewEligibility,
  addReview,
  updateReview,
  updateReviewById,
  getHotelById,
} from '../controllers/review.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Hotel reviews — submit, update and read
 */

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Get reviews for a hotel (top 7 by rating + avg + total)
 *     tags: [Reviews]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: entityId
 *         required: true
 *         schema: { type: string }
 *         description: Hotel ID
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:   { type: array, items: { $ref: '#/components/schemas/Review' } }
 *                 avgRating: { type: number }
 *                 total:     { type: number }
 */
router.get('/', getReviewsByHotel);

/**
 * @swagger
 * /reviews/user:
 *   get:
 *     summary: Get review by current user for a specific hotel
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: entityId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 */
router.get('/user', authenticate('jwt'), getReviewByUserAndEntity);

/**
 * @swagger
 * /reviews/validate:
 *   get:
 *     summary: Check if user has a confirmed booking for this hotel (review eligibility)
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: hotelId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Array of qualifying bookings }
 */
router.get('/validate', validateReviewEligibility);

/**
 * @swagger
 * /reviews/hotel/{hotelId}:
 *   get:
 *     summary: Get hotel document by ID
 *     tags: [Reviews]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Hotel object }
 */
router.get('/hotel/:hotelId', getHotelById);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Submit a new review
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       201: { description: Review created }
 *       409: { description: Already reviewed this hotel }
 */
router.post('/', authenticate('jwt'), addReview);

/**
 * @swagger
 * /reviews/user/{userId}/entity/{entityId}:
 *   put:
 *     summary: Update an existing review (by userId + entityId)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       200: { description: Review updated }
 */
router.put('/user/:userId/entity/:entityId', authenticate('jwt'), updateReview);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Update a review by its own ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       200: { description: Review updated }
 */
router.put('/:id', authenticate('jwt'), updateReviewById);

export const reviewRoutes = router;
