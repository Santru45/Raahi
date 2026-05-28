import { Router } from 'express';
import {
  getAllItems,
  getItemById,
  createItem,
  deleteItem,
} from '../controllers/itineraryItem.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Itinerary Items
 *   description: Individual items within an itinerary
 */

/**
 * @swagger
 * /itinerary-items:
 *   get:
 *     summary: Get all itinerary items (optionally filter by itineraryId)
 *     tags: [Itinerary Items]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: itineraryId
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of items }
 *   post:
 *     summary: Create an itinerary item
 *     tags: [Itinerary Items]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itineraryId: { type: string }
 *               title:       { type: string }
 *               date:        { type: string, format: date }
 *               notes:       { type: string }
 *     responses:
 *       201: { description: Item created }
 */
router.get('/', getAllItems);
router.post('/', createItem);

/**
 * @swagger
 * /itinerary-items/{id}:
 *   get:
 *     summary: Get a single itinerary item
 *     tags: [Itinerary Items]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Item object }
 *   delete:
 *     summary: Delete an itinerary item
 *     tags: [Itinerary Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.get('/:id', getItemById);
router.delete('/:id', deleteItem);

export const itineraryItemRoutes = router;
