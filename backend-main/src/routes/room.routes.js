import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import requireAdmin from "../middleware/admin.middleware.js";
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoomStatus,
  getAvailableRooms,
  getRatePlans,
  createRatePlan,
} from "../controllers/room.controller.js";

/**
 * @swagger
 * tags:
 *   - name: Rooms
 *     description: Hotel rooms — availability and status
 *   - name: Rate Plans
 *     description: Pricing plans attached to hotels
 */

const roomRouter = Router();

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Get rooms (optionally filtered by hotelId)
 *     tags: [Rooms]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: hotelId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 */
roomRouter.get("/", getRooms);
roomRouter.get("/available", getAvailableRooms);

/**
 * @swagger
 * /rooms/{id}:
 *   get:
 *     summary: Get a single room by ID
 *     tags: [Rooms]
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
 *               $ref: '#/components/schemas/Room'
 */
roomRouter.get("/:id", getRoomById);

/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Create a new room (backend enforces admin — requireAdmin middleware)
 *     tags: [Rooms]
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       201: { description: Room created }
 */
roomRouter.post("/", authenticate("jwt"), requireAdmin, createRoom);

/**
 * @swagger
 * /rooms/{id}/status:
 *   patch:
 *     summary: Update room availability status (backend enforces admin — requireAdmin middleware)
 *     tags: [Rooms]
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
 *             type: object
 *             properties:
 *               isAvailable: { type: boolean }
 *     responses:
 *       200: { description: Room updated }
 */
roomRouter.patch(
  "/:id/status",
  authenticate("jwt"),
  requireAdmin,
  updateRoomStatus,
);

/**
 * @swagger
 * /rooms/{id}:
 *   patch:
 *     summary: Update a room (customer — used when booking/cancelling to toggle availability)
 *     tags: [Rooms]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       200: { description: Room updated }
 */
roomRouter.patch("/:id", authenticate("jwt"), updateRoomStatus);

export const roomRoutes = roomRouter;

const ratePlanRouter = Router();

/**
 * @swagger
 * /rate-plans:
 *   get:
 *     summary: Get rate plans (optionally filtered by hotelId)
 *     tags: [Rate Plans]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: hotelId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:       { type: string }
 *                   hotelId:   { type: string }
 *                   name:      { type: string }
 *                   pricePerNight: { type: number }
 */
ratePlanRouter.get("/", getRatePlans);

/**
 * @swagger
 * /rate-plans:
 *   post:
 *     summary: Create a rate plan (backend enforces admin — requireAdmin middleware)
 *     tags: [Rate Plans]
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hotelId:       { type: string }
 *               name:          { type: string }
 *               pricePerNight: { type: number }
 *     responses:
 *       201: { description: Rate plan created }
 */
ratePlanRouter.post("/", authenticate("jwt"), requireAdmin, createRatePlan);

export const ratePlanRoutes = ratePlanRouter;
