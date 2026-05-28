import express from 'express';
import {
  getHotelBookingsByUser,
  getTravelBookingsByUser,
  getAllBookingsForUser,
  getAllHotelBookings,
  getAllTravelBookings,
  createHotelBooking,
  updateHotelBooking,
} from '../controllers/booking.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import requireAdmin from '../middleware/admin.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Unified booking history (hotel + travel) — admin and per-user views
 */

/**
 * @swagger
 * /bookings/hotel:
 *   get:
 *     summary: Get all hotel bookings (admin dashboard only)
 *     tags: [Bookings]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: List of all hotel bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HotelBooking'
 *       403: { description: Forbidden — admin role required }
 *   post:
 *     summary: Create a hotel booking (customer)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
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
 *     responses:
 *       201:
 *         description: Booking created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HotelBooking'
 */
router.get('/hotel', authenticate('jwt'), requireAdmin, getAllHotelBookings);
router.post('/hotel', authenticate('jwt'), createHotelBooking);

/**
 * @swagger
 * /bookings/hotel/{id}:
 *   patch:
 *     summary: Update a hotel booking (customer)
 *     tags: [Bookings]
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
 *             $ref: '#/components/schemas/HotelBooking'
 *     responses:
 *       200: { description: Booking updated }
 *       404: { description: Not found }
 */
router.patch('/hotel/:id', authenticate('jwt'), updateHotelBooking);

/**
 * @swagger
 * /bookings/travel:
 *   get:
 *     summary: Get all travel bookings (admin dashboard only)
 *     tags: [Bookings]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200: { description: List of all travel bookings }
 *       403: { description: Forbidden — admin role required }
 */
router.get('/travel', authenticate('jwt'), requireAdmin, getAllTravelBookings);

/**
 * @swagger
 * /bookings/hotel/user/{userId}:
 *   get:
 *     summary: Get hotel bookings for a specific user (customer — own bookings only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User's hotel bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HotelBooking'
 */
router.get('/hotel/user/:userId', authenticate('jwt'), getHotelBookingsByUser);

/**
 * @swagger
 * /bookings/travel/user/{userId}:
 *   get:
 *     summary: Get travel bookings for a specific user (customer — own bookings only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User's travel bookings }
 */
router.get(
  '/travel/user/:userId',
  authenticate('jwt'),
  getTravelBookingsByUser,
);

/**
 * @swagger
 * /bookings/user/{userId}:
 *   get:
 *     summary: Get all bookings (hotel + travel) for a user (customer — own bookings only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Combined hotel and travel bookings }
 */
router.get('/user/:userId', authenticate('jwt'), getAllBookingsForUser);

export const bookingRoutes = router;
