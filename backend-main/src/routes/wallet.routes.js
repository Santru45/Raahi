import express from 'express';
import {
  getWalletByUser,
  updateWallet,
} from '../controllers/wallet.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: User wallet — top-up, debit and view balance
 */

/**
 * @swagger
 * /wallets/{userId}:
 *   get:
 *     summary: Get wallet for a user
 *     tags: [Wallet]
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
 *               $ref: '#/components/schemas/Wallet'
 */
router.get('/:userId', authenticate('jwt'), getWalletByUser);

/**
 * @swagger
 * /wallets/{walletId}:
 *   patch:
 *     summary: Update wallet balance (top-up or debit)
 *     tags: [Wallet]
 *     parameters:
 *       - in: path
 *         name: walletId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number, description: Positive = top-up, negative = debit }
 *               type:   { type: string, enum: [topup, debit, refund] }
 *               note:   { type: string }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wallet'
 */
router.put('/:walletId', authenticate('jwt'), updateWallet);
router.patch('/:walletId', authenticate('jwt'), updateWallet);

export const walletRoutes = router;
