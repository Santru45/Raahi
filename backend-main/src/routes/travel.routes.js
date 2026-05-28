import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import { validateBooking } from "../middleware/validateBooking.js";
import { validateSeat } from "../middleware/validateSeat.js";
import {
  getServices,
  getLocations,
  getBoardingPoints,
  getBookedSeats,
  checkPnrUnique,
  saveBooking,
  saveBookedSeat,
  updateAvailableSeats,
  cancelTravelBooking,
} from "../controllers/travel.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Travel
 *   description: Travel services API for flights, trains, and buses including bookings, locations, and seat management
 */

/**
 * @swagger
 * /travel/travelServices:
 *   get:
 *     summary: Get all available travel services
 *     description: Retrieve travel services (flights/trains/buses) with optional filters for type, route, class, and date
 *     tags: [Travel]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [flight, train, bus]
 *         description: Filter by travel type
 *         example: flight
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         description: Source location (case-insensitive partial match)
 *         example: Chennai
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: Destination location (case-insensitive partial match)
 *         example: Delhi
 *       - in: query
 *         name: cabinClass
 *         schema:
 *           type: string
 *         description: Filter by cabin class (e.g., Economy, Business)
 *         example: Economy
 *     responses:
 *       200:
 *         description: List of travel services with booked seats information
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TravelService'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/travelServices", getServices);

/**
 * @swagger
 * /travel/locations:
 *   get:
 *     summary: Get all travel locations
 *     description: Retrieve airports, train stations, and bus terminals with search capability
 *     tags: [Travel]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [flight, train, bus]
 *         description: Filter by location type
 *         example: flight
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (searches name, city, and code fields)
 *         example: chen
 *     responses:
 *       200:
 *         description: List of matching locations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TravelLocation'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/locations", getLocations);

/**
 * @swagger
 * /travel/boardingPoints:
 *   get:
 *     summary: Get boarding/dropping points for a service
 *     description: Retrieve available boarding and dropping points for a specific travel service
 *     tags: [Travel]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *         description: Travel service ID
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [flight, train, bus]
 *         description: Filter by service type
 *         example: bus
 *     responses:
 *       200:
 *         description: List of boarding points
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BoardingPoint'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/boardingPoints", getBoardingPoints);

/**
 * @swagger
 * /travel/bookedSeats:
 *   get:
 *     summary: Get booked seats for a service
 *     description: Retrieve all booked seats for a specific travel service
 *     tags: [Travel]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *         description: Travel service ID
 *         required: true
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: List of booked seats
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookedSeat'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/bookedSeats", getBookedSeats);

/**
 * @swagger
 * /travel/travelBookings:
 *   get:
 *     summary: Check if booking reference is unique
 *     description: Verify if a PNR/booking reference already exists in the system
 *     tags: [Travel]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: bookingReference
 *         schema:
 *           type: string
 *         description: Booking reference/PNR to check
 *         example: TRV123456
 *     responses:
 *       200:
 *         description: Booking reference check result
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TravelBooking'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new travel booking
 *     description: Create a confirmed booking for flight/train/bus with passenger details
 *     tags: [Travel]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - serviceSnapshot
 *               - passengers
 *               - totalFare
 *               - bookingReference
 *             properties:
 *               serviceId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               serviceSnapshot:
 *                 type: object
 *                 properties:
 *                   type: { type: string, example: flight }
 *                   operatorName: { type: string, example: IndiGo }
 *                   serviceNumber: { type: string, example: 6E-2345 }
 *                   from: { type: string, example: Chennai }
 *                   to: { type: string, example: Delhi }
 *                   departureTime: { type: string, example: '2026-06-15T06:00:00.000Z' }
 *                   arrivalTime: { type: string, example: '2026-06-15T09:30:00.000Z' }
 *                   cabinClass: { type: string, example: Economy }
 *               passengers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     firstName: { type: string, example: John }
 *                     lastName: { type: string, example: Doe }
 *                     age: { type: number, example: 30 }
 *                     gender: { type: string, enum: [male, female], example: male }
 *                     seatNumber: { type: string, example: 12A }
 *                     isPrimary: { type: boolean, example: true }
 *                     idType: { type: string, example: Passport }
 *                     idNumber: { type: string, example: A1234567 }
 *               boardingPoint: { type: string, example: Terminal 1 }
 *               droppingPoint: { type: string, example: Terminal 2 }
 *               totalFare: { type: number, example: 9500 }
 *               taxAmount: { type: number, example: 1140 }
 *               discountAmount: { type: number, example: 0 }
 *               finalAmount: { type: number, example: 10640 }
 *               bookingReference: { type: string, example: TRV123456 }
 *               bookingStatus: { type: string, enum: [confirmed, cancelled], example: confirmed }
 *               paymentStatus: { type: string, enum: [paid, pending, refunded], example: paid }
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TravelBooking'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - JWT token required
 *       409:
 *         description: Duplicate booking reference
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: 'Duplicate booking reference. Please try again.' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/travelBookings", checkPnrUnique);
router.post(
  "/travelBookings",
  authenticate("jwt"),
  validateBooking,
  saveBooking,
);

/**
 * @swagger
 * /travel/bookedSeats:
 *   post:
 *     summary: Save booked seat records
 *     description: Create seat booking records for selected seats
 *     tags: [Travel]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - seatNumber
 *               - bookingId
 *             properties:
 *               serviceId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               seatNumber:
 *                 type: string
 *                 example: 12A
 *               bookingId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439012
 *     responses:
 *       201:
 *         description: Seat booking saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookedSeat'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - JWT token required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/bookedSeats", authenticate("jwt"), validateSeat, saveBookedSeat);

/**
 * @swagger
 * /travel/travelServices/{id}:
 *   patch:
 *     summary: Update available seats after booking
 *     description: Decrease available seats count when a booking is confirmed
 *     tags: [Travel]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Travel service ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seatsBooked
 *             properties:
 *               seatsBooked:
 *                 type: number
 *                 description: Number of seats booked
 *                 example: 2
 *     responses:
 *       200:
 *         description: Available seats updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: 'Seats updated successfully' }
 *                 availableSeats: { type: number, example: 43 }
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized - JWT token required
 *       404:
 *         description: Travel service not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/travelServices/:id", authenticate("jwt"), updateAvailableSeats);

/**
 * @swagger
 * /travel/travelBookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a travel booking (auto-refunds wallet)
 *     description: Cancels a confirmed travel booking, frees up booked seats, and refunds the amount to user's wallet. Also handles loyalty coins clawback.
 *     tags: [Travel]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Travel booking ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancellationReason:
 *                 type: string
 *                 description: Optional reason for cancellation
 *                 example: Change of plans
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TravelBooking'
 *       400:
 *         description: Booking already cancelled
 *       401:
 *         description: Unauthorized - JWT token required
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  "/travelBookings/:id/cancel",
  authenticate("jwt"),
  cancelTravelBooking,
);

export const travelRoutes = router;
