import express from 'express';
import {
  getAllUsers,
  deleteUserById,
  getUserById,
  updateUser,
  getUserByEmail,
} from '../controllers/user.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import requireAdmin from '../middleware/admin.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (admin dashboard — lists all registered users)
 *     tags: [Users]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', authenticate('jwt'), requireAdmin, getAllUsers);

/**
 * @swagger
 * /users/by-email:
 *   get:
 *     summary: Find a user by email (used in forgot-password flow)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/by-email', authenticate('jwt'), getUserByEmail);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
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
 *               $ref: '#/components/schemas/User'
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200: { description: Updated user }
 *   delete:
 *     summary: Delete a user (admin dashboard only)
 *     tags: [Users]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User deleted }
 */
router.get('/:id', authenticate('jwt'), getUserById);
router.patch('/:id', authenticate('jwt'), updateUser);
router.delete(
  '/:id',
  authenticate('jwt'),
  (req, res, next) => {
    // Allow admins OR the user deleting their own account
    if (
      req.user.role === 'admin' ||
      req.user._id.toString() === req.params.id
    ) {
      return next();
    }
    return res.status(403).json({ message: 'Access denied' });
  },
  deleteUserById,
);

export const userRoutes = router;
