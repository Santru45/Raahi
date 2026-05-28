import express from "express";
import {
  getLoyaltyByUser,
  awardCoins,
  validateRedeem,
  redeemCoins,
  handleCancellation,
} from "../controllers/loyalty.controller.js";
import authenticate from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Loyalty
 *   description: Loyalty coins — earn, redeem, clawback on cancel
 */

/**
 * @swagger
 * /loyalty/{userId}:
 *   get:
 *     summary: Get loyalty account for a user
 *     tags: [Loyalty]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoyaltyAccount'
 */
router.get("/:userId", authenticate("jwt"), getLoyaltyByUser);

/**
 * @swagger
 * /loyalty/{userId}/award:
 *   post:
 *     summary: Award coins after a booking
 *     tags: [Loyalty]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:           { type: number }
 *               bookingReference: { type: string }
 *               bookingType:      { type: string }
 *     responses:
 *       200: { description: Updated loyalty account }
 */
router.post("/:userId/award", authenticate("jwt"), awardCoins);

/**
 * @swagger
 * /loyalty/{userId}/validate-redeem:
 *   post:
 *     summary: Validate if coins can be redeemed
 *     tags: [Loyalty]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coinsToRedeem: { type: number }
 *               bookingAmount: { type: number }
 *     responses:
 *       200: { description: Validation result }
 */
router.post("/:userId/validate-redeem", authenticate("jwt"), validateRedeem);

/**
 * @swagger
 * /loyalty/{userId}/redeem:
 *   post:
 *     summary: Redeem coins against a booking
 *     tags: [Loyalty]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coinsToRedeem:    { type: number }
 *               bookingReference: { type: string }
 *               bookingType:      { type: string }
 *     responses:
 *       200: { description: Updated loyalty account }
 */
router.post("/:userId/redeem", authenticate("jwt"), redeemCoins);

/**
 * @swagger
 * /loyalty/{userId}/cancel:
 *   post:
 *     summary: Clawback earned coins and refund redeemed coins on booking cancellation
 *     tags: [Loyalty]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingReference: { type: string }
 *               coinsEarned:      { type: number }
 *               coinsRedeemed:    { type: number }
 *     responses:
 *       200: { description: Updated loyalty account }
 */
router.post("/:userId/cancel", authenticate("jwt"), handleCancellation);

export const loyaltyRoutes = router;
