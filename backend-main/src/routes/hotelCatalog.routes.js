import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import requireAdmin from "../middleware/admin.middleware.js";
import {
  getMeta,
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  validateCoupon,
} from "../controllers/hotelCatalog.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Hotels
 *   description: Hotel catalog — search, filter and manage hotels
 */

/**
 * @swagger
 * /hotel-catalog/meta:
 *   get:
 *     summary: Get filter metadata (cities, amenities, hotel types)
 *     tags: [Hotels]
 *     security: []
 *     responses:
 *       200: { description: Filter options }
 */
router.get("/meta", getMeta);
router.post("/validate-coupon", validateCoupon);

/**
 * @swagger
 * /hotel-catalog:
 *   get:
 *     summary: Search / list hotels
 *     tags: [Hotels]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: checkIn
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: checkOut
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: adults
 *         schema: { type: integer }
 *       - in: query
 *         name: rooms
 *         schema: { type: integer }
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
router.get("/", getHotels);

/**
 * @swagger
 * /hotel-catalog/{id}:
 *   get:
 *     summary: Get a single hotel by ID
 *     tags: [Hotels]
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
 */
router.get("/:id", getHotelById);

/**
 * @swagger
 * /hotel-catalog:
 *   post:
 *     summary: Create a new hotel (backend enforces admin — requireAdmin middleware)
 *     tags: [Hotels]
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       201: { description: Hotel created }
 */
router.post("/", authenticate("jwt"), requireAdmin, createHotel);

/**
 * @swagger
 * /hotel-catalog/{id}:
 *   patch:
 *     summary: Update a hotel (backend enforces admin — requireAdmin middleware)
 *     tags: [Hotels]
 *     security:
 *       - AdminAuth: []
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
router.patch("/:id", authenticate("jwt"), requireAdmin, updateHotel);

export const hotelCatalogRoutes = router;
