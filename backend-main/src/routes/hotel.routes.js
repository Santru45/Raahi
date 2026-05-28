import express from 'express';
import {
  getHotelById,
  getAllHotels,
  updateHotel,
} from '../controllers/hotel.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Hotels (legacy)
 *   description: Legacy hotel routes — prefer /hotel-catalog for new code
 */

/**
 * @swagger
 * /hotels:
 *   get:
 *     summary: Get all hotels (public — also used by admin dashboard for hotel name lookup)
 *     tags: [Hotels (legacy)]
 *     security: []
 *     responses:
 *       200:
 *         description: List of hotels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hotel'
 */
router.get('/', getAllHotels);

/**
 * @swagger
 * /hotels/{id}:
 *   get:
 *     summary: Get a hotel by ID
 *     tags: [Hotels (legacy)]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       404: { description: Not found }
 *   patch:
 *     summary: Update a hotel
 *     tags: [Hotels (legacy)]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       200: { description: Hotel updated }
 */
router.get('/:id', getHotelById);
router.patch('/:id', authenticate('jwt'), updateHotel);

export const hotelRoutes = router;
