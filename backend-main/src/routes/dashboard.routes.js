import express from "express";
import {
  getDashboardStats,
  getRecentBookings,
  getTopHotels,
  getUsers,
} from "../controllers/dashboard.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import requireAdmin from "../middleware/admin.middleware.js";

const router = express.Router();

router.get("/stats", authenticate("jwt"), requireAdmin, getDashboardStats);
router.get(
  "/recent-bookings",
  authenticate("jwt"),
  requireAdmin,
  getRecentBookings,
);
router.get("/top-hotels", authenticate("jwt"), requireAdmin, getTopHotels);
router.get("/users", authenticate("jwt"), requireAdmin, getUsers);

export const dashboardRoutes = router;
