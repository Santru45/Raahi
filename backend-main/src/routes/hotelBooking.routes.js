import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import {
  createHotelBooking,
  getMyHotelBookings,
  getHotelBookingById,
  cancelHotelBooking,
} from '../controllers/hotelBooking.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Hotel Bookings
 *   description: Create, view and cancel hotel bookings
 */

/**
 * @swagger
 * /hotel-bookings:
 *   post:
 *     summary: Create a hotel booking
 *     tags: [Hotel Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hotelId, roomId, checkIn, checkOut, totalPrice]
 *             properties:
 *               hotelId:    { type: string }
 *               roomId:     { type: string }
 *               checkIn:    { type: string, format: date }
 *               checkOut:   { type: string, format: date }
 *               totalPrice: { type: number }
 *               coinsRedeemed: { type: number }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HotelBooking'
 */
router.post('/', authenticate('jwt'), createHotelBooking);

/**
 * @swagger
 * /hotel-bookings:
 *   get:
 *     summary: Get all bookings for the logged-in user
 *     tags: [Hotel Bookings]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HotelBooking'
 */
router.get('/', authenticate('jwt'), getMyHotelBookings);

/**
 * @swagger
 * /hotel-bookings/{id}:
 *   get:
 *     summary: Get a single hotel booking by ID
 *     tags: [Hotel Bookings]
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
 *               $ref: '#/components/schemas/HotelBooking'
 *       404: { description: Not found }
 */
router.get('/:id', authenticate('jwt'), getHotelBookingById);

/**
 * @swagger
 * /hotel-bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking (auto-refunds wallet)
 *     tags: [Hotel Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Booking cancelled and wallet refunded }
 *       404: { description: Booking not found }
 */
router.patch('/:id/cancel', authenticate('jwt'), cancelHotelBooking);

export const hotelBookingRoutes = router;
