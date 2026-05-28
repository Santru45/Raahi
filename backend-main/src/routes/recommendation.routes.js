import { Router } from 'express';
import {
  getRecommendations,
  getOfferWithHotels,
  getHotelById,
} from '../controllers/recommendation.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: Personalised hotel recommendations and offers
 */

/**
 * @swagger
 * /recommendations:
 *   get:
 *     summary: Get personalised hotel recommendations for the logged-in user
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of recommended hotels }
 */
router.get('/', getRecommendations);

/**
 * @swagger
 * /recommendations/offer/{offerId}:
 *   get:
 *     summary: Get an offer with its associated hotels
 *     tags: [Recommendations]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Offer and hotels }
 */
router.get('/offer/:offerId', getOfferWithHotels);

/**
 * @swagger
 * /recommendations/hotel/{hotelId}:
 *   get:
 *     summary: Get hotel detail for recommendation card
 *     tags: [Recommendations]
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

export const recommendationRoutes = router;
