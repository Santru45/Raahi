import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import requireAdmin from '../middleware/admin.middleware.js';
import {
  checkAvailability,
  getPricing,
  upsertInventory,
} from '../controllers/inventory.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Room availability and pricing per date range
 */

/**
 * @swagger
 * /inventory/availability:
 *   get:
 *     summary: Check room availability for a date range
 *     tags: [Inventory]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *         description: Room ID to check
 *       - in: query
 *         name: checkIn
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: checkOut
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Availability result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available: { type: boolean }
 */
router.get('/availability', checkAvailability);

/**
 * @swagger
 * /inventory/pricing:
 *   get:
 *     summary: Get pricing for a room over a date range
 *     tags: [Inventory]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: checkIn
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: checkOut
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Pricing breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPrice:    { type: number }
 *                 pricePerNight: { type: number }
 *                 nights:        { type: number }
 */
router.get('/pricing', getPricing);

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Create or update inventory record (backend enforces admin — requireAdmin middleware)
 *     tags: [Inventory]
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roomId, date]
 *             properties:
 *               roomId:        { type: string }
 *               date:          { type: string, format: date }
 *               isAvailable:   { type: boolean }
 *               priceOverride: { type: number, description: Override nightly price for this date }
 *     responses:
 *       200: { description: Inventory record created or updated }
 */
router.post('/', authenticate('jwt'), requireAdmin, upsertInventory);

export const inventoryRoutes = router;
