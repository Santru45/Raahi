import TravelService from "../models/travel/TravelService.js";
import TravelBooking from "../models/travel/TravelBooking.js";
import BookedSeat from "../models/travel/BookedSeat.js";
import Location from "../models/travel/Location.js";
import BoardingPoint from "../models/travel/BoardingPoint.js";
import Wallet from "../models/wallet.model.js";
import { processLoyaltyCancellation } from "./loyalty.controller.js";
import mongoose from "mongoose";

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// GET /api/travel/travelServices
export const getServices = async (req, res) => {
  try {
    const { type, from, to, cabinClass, date } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    if (from) filter.from = { $regex: from, $options: "i" };
    if (to) filter.to = { $regex: to, $options: "i" };
    if (cabinClass) filter.cabinClass = { $regex: cabinClass, $options: "i" };
    if (date) {
      // Treat the date as local (IST UTC+5:30) — adjust to UTC boundaries
      // Start of day in IST = date T00:00:00 IST = date T-05:30 UTC = previous day 18:30 UTC
      // End of day in IST = date T23:59:59 IST = date T18:29:59 UTC
      const startOfDay = new Date(date + "T00:00:00+05:30");
      const endOfDay = new Date(date + "T23:59:59.999+05:30");
      filter["schedule.departureTime"] = { $gte: startOfDay, $lte: endOfDay };
    }
    const services = await TravelService.find(filter);

    // Populate booked seats for each service
    const servicesWithBookedSeats = await Promise.all(
      services.map(async (service) => {
        const bookedSeats = await BookedSeat.find({
          serviceId: service._id,
        }).select("seatNumber serviceId -_id");
        return {
          ...service.toObject(),
          bookedSeats: bookedSeats,
        };
      }),
    );

    res.json(servicesWithBookedSeats);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/travel/locations
export const getLocations = async (req, res) => {
  try {
    const { type, q } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } },
        { code: { $regex: q, $options: "i" } },
      ];
    }
    const locations = await Location.find(filter);
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/travel/boardingPoints
export const getBoardingPoints = async (req, res) => {
  try {
    const { serviceId, type } = req.query;
    const filter = {};
    if (serviceId) filter.serviceId = toObjectId(serviceId);
    if (type) filter.type = type;
    const points = await BoardingPoint.find(filter);
    res.json(points);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/travel/bookedSeats
export const getBookedSeats = async (req, res) => {
  try {
    const { serviceId } = req.query;
    const filter = {};
    if (serviceId) filter.serviceId = toObjectId(serviceId);
    const bookedSeats = await BookedSeat.find(filter);
    res.json(bookedSeats);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/travel/travelBookings?bookingReference=xxx
export const checkPnrUnique = async (req, res) => {
  try {
    const { bookingReference } = req.query;
    const filter = {};
    if (bookingReference) filter.bookingReference = bookingReference;
    const bookings = await TravelBooking.find(filter);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/travel/travelBookings (protected)
export const saveBooking = async (req, res) => {
  try {
    const userId = req.user._id;
    const booking = await TravelBooking.create({
      ...req.body,
      userId: userId.toString(),
    });
    res.status(201).json(booking);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Duplicate booking reference. Please try again." });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/travel/bookedSeats (protected)
export const saveBookedSeat = async (req, res) => {
  try {
    const seat = await BookedSeat.create(req.body);
    res.status(201).json(seat);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/travel/travelServices/:id (protected)
export const updateAvailableSeats = async (req, res) => {
  try {
    const { id } = req.params;
    const { availableSeats } = req.body;
    const updated = await TravelService.findByIdAndUpdate(
      id,
      { availableSeats },
      { new: true },
    );
    if (!updated) return res.status(404).json({ message: "Service not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/travel/travelBookings/:id/cancel (protected)
export const cancelTravelBooking = async (req, res) => {
  try {
    const { cancellationReason, refundPercent = 100 } = req.body;
    const booking = await TravelBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({ message: "Already cancelled" });
    }

    // Update booking status
    booking.bookingStatus = "cancelled";
    booking.paymentStatus = "refunded";
    booking.cancellationReason = cancellationReason;
    booking.cancelledAt = new Date();
    await booking.save();

    // Free up booked seats
    if (booking.passengers?.length) {
      const seatNumbers = booking.passengers
        .map((p) => p.seatNumber)
        .filter(Boolean);

      if (seatNumbers.length > 0) {
        await BookedSeat.deleteMany({
          serviceId: booking.serviceId,
          seatId: { $in: seatNumbers },
        });
      }
    }

    // Refund wallet if payment was by wallet or razorpay
    const fullAmount = booking.pricing?.totalAmount ?? 0;
    const refundAmount = Math.round(
      (fullAmount * Math.min(refundPercent, 100)) / 100,
    );
    if (
      refundAmount > 0 &&
      (booking.paymentMethod === "wallet" ||
        booking.paymentMethod === "razorpay")
    ) {
      const wallet = await Wallet.findOne({
        userId: new mongoose.Types.ObjectId(booking.userId.toString()),
      });

      if (wallet) {
        const newBalance = wallet.balance + refundAmount;
        wallet.balance = newBalance;
        wallet.transactions.push({
          _id: `txn_${Date.now()}`,
          type: "refund",
          amount: refundAmount,
          balanceAfter: newBalance,
          description: `Refund — ${booking.serviceSnapshot?.operatorName ?? "Travel booking"} cancelled`,
          bookingReference: booking.bookingReference,
        });
        await wallet.save();
      }
    }

    // ── Loyalty coins clawback / reinstate (delegated to loyalty controller) ─
    await processLoyaltyCancellation(booking.userId.toString(), {
      bookingReference: booking.bookingReference,
      bookingType: "travel",
      coinsEarned: booking.coinsEarned ?? 0,
      coinsRedeemed: booking.coinsRedeemed ?? 0,
      clawbackPct: Math.min(refundPercent, 100),
    });

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
