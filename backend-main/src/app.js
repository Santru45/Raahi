import "dotenv/config";
import express from "express";
import cors from "cors";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { connectDB } from "./config/db.js";
import configurePassport from "./config/passport.js";
import { authRoutes } from "./routes/auth.routes.js";
import { bookingRoutes } from "./routes/booking.routes.js";
import { hotelRoutes } from "./routes/hotel.routes.js";
import { hotelCatalogRoutes } from "./routes/hotelCatalog.routes.js";
import { hotelBookingRoutes } from "./routes/hotelBooking.routes.js";
import { roomRoutes, ratePlanRoutes } from "./routes/room.routes.js";
import { inventoryRoutes } from "./routes/inventory.routes.js";
import { loyaltyRoutes } from "./routes/loyalty.routes.js";
import { walletRoutes } from "./routes/wallet.routes.js";
import { userRoutes } from "./routes/user.routes.js";
import { reviewRoutes } from "./routes/review.routes.js";
import { reviewPromptRoutes } from "./routes/reviewPrompt.routes.js";
import { travelRoutes } from "./routes/travel.routes.js";
import { itineraryRoutes } from "./routes/itinerary.routes.js";
import { itineraryItemRoutes } from "./routes/itineraryItem.routes.js";
import { recommendationRoutes } from "./routes/recommendation.routes.js";
import { dashboardRoutes } from "./routes/dashboard.routes.js";
import { refreshTravelServices } from "./utils/refreshTravelServices.js";
import mongoose from "mongoose";

// Bootstrap
configurePassport();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Debug logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Attach db to app.locals for raw collection access
mongoose.connection.once("open", () => {
  app.locals.db = mongoose.connection.db;
  refreshTravelServices();
});

// Health check
app.get("/", (_req, res) => res.json({ message: "API running ✅" }));

// Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Travel App API Docs",
    swaggerOptions: { persistAuthorization: true },
  }),
);
app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/users", userRoutes);

// Review routes
app.use("/api/reviews", reviewRoutes);
app.use("/api/prompts", reviewPromptRoutes);

// Hotel routes
app.use("/api/hotel-catalog", hotelCatalogRoutes);
app.use("/api/hotel-bookings", hotelBookingRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/rate-plans", ratePlanRoutes);
app.use("/api/inventory", inventoryRoutes);

// Travel routes
app.use("/api/travel", travelRoutes);

// Itinerary routes
app.use("/api/itineraries", itineraryRoutes);
app.use("/api/itinerary-items", itineraryItemRoutes);

// Recommendation routes
app.use("/api/recommendations", recommendationRoutes);

// Admin routes
app.use("/api/admin", dashboardRoutes);

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`),
);
