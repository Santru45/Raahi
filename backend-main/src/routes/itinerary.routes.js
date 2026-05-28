import { Router } from 'express';
import {
  getAllItineraries,
  getItineraryById,
  createItinerary,
  patchItinerary,
  deleteItinerary,
} from '../controllers/itinerary.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Itineraries
 *   description: Trip itineraries
 */

/**
 * @swagger
 * /itineraries:
 *   get:
 *     summary: Get all itineraries
 *     tags: [Itineraries]
 *     security: []
 *     responses:
 *       200: { description: List of itineraries }
 *   post:
 *     summary: Create a new itinerary
 *     tags: [Itineraries]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:       { type: string }
 *               destination: { type: string }
 *               startDate:   { type: string, format: date }
 *               endDate:     { type: string, format: date }
 *     responses:
 *       201: { description: Itinerary created }
 */
router.get('/', getAllItineraries);
router.post('/', createItinerary);

/**
 * @swagger
 * /itineraries/{id}:
 *   get:
 *     summary: Get itinerary by ID
 *     tags: [Itineraries]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Itinerary object }
 *   patch:
 *     summary: Update itinerary
 *     tags: [Itineraries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete itinerary
 *     tags: [Itineraries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.get('/:id', getItineraryById);
router.patch('/:id', patchItinerary);
router.delete('/:id', deleteItinerary);

export const itineraryRoutes = router;
