import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import {
  getPrompts,
  dismissPrompt,
  markReviewed,
} from '../controllers/reviewPrompt.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Review Prompts
 *   description: Post-stay review nudge banners
 */

/**
 * @swagger
 * /prompts/{userId}:
 *   get:
 *     summary: Get pending review prompt for a user (creates missing prompts from completed bookings)
 *     tags: [Review Prompts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of 0 or 1 pending prompts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:              { type: string }
 *                   hotelId:          { type: string }
 *                   hotelName:        { type: string }
 *                   hotelType:        { type: string }
 *                   bookingReference: { type: string }
 *                   status:           { type: string }
 *                   nudgeCount:       { type: number }
 */
router.get('/:userId', authenticate('jwt'), getPrompts);

/**
 * @swagger
 * /prompts/{promptId}/dismiss:
 *   patch:
 *     summary: Permanently dismiss a review prompt
 *     tags: [Review Prompts]
 *     parameters:
 *       - in: path
 *         name: promptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Prompt dismissed }
 */
router.patch('/:promptId/dismiss', authenticate('jwt'), dismissPrompt);

/**
 * @swagger
 * /prompts/{promptId}/reviewed:
 *   patch:
 *     summary: Mark a prompt as reviewed (called after review form submission)
 *     tags: [Review Prompts]
 *     parameters:
 *       - in: path
 *         name: promptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Prompt marked reviewed }
 */
router.patch('/:promptId/reviewed', authenticate('jwt'), markReviewed);

export const reviewPromptRoutes = router;
