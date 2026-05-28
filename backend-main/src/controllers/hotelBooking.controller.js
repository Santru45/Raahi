import HotelBooking from "../models/hotel/HotelBooking.js";
import Room from "../models/hotel/Room.js";
import Wallet from "../models/wallet.model.js";
import { processLoyaltyCancellation } from "./loyalty.controller.js";
import mongoose from "mongoose";

// POST /api/hotel-bookings
export const createHotelBooking = async (req, res, next) => {
  try {
    const {
      userId,
      hotelId,
      roomId, // single-room legacy path
      rooms, // multi-room array from newer frontend
      hotelName,
      checkIn,
      checkOut,
      numAdults,
      numChildren,
      guests,
      pricing,
      walletAmountUsed,
      coinsRedeemed,
      coinsEarned,
      couponCode,
      bookingReference,
      paymentMethod,
      source,
      specialRequests,
      roomSnapshot,
      ratePlanSnapshot,
    } = req.body;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const numNights = Math.ceil((checkOutDate - checkInDate) / 86400000);

    // Support single roomId or rooms[]
    const roomList = rooms?.length
      ? rooms
      : roomId
        ? [
            {
              roomId: roomId,
              roomSnapshot: roomSnapshot || {},
              ratePlanSnapshot: ratePlanSnapshot || {},
            },
          ]
        : [];

    // Create ONE booking with multiple rooms
    const booking = await HotelBooking.create({
      userId,
      hotelId,
      roomId: roomId || null, // Legacy single room support
      rooms: roomList.map((r) => ({
        roomId: r.roomId,
        roomType: r.roomType || r.roomSnapshot?.roomType,
        bedType: r.bedType || r.roomSnapshot?.bedType,
        pricePerNight: r.pricePerNight || r.roomSnapshot?.pricePerNight,
      })),
      hotelName,
      roomSnapshot: roomSnapshot || {},
      ratePlanSnapshot: ratePlanSnapshot || {},
      checkIn: checkInDate,
      checkOut: checkOutDate,
      numNights,
      numAdults,
      numChildren: numChildren || 0,
      guests,
      pricing,
      walletAmountUsed: walletAmountUsed || 0,
      coinsRedeemed: coinsRedeemed || 0,
      coinsEarned: coinsEarned || 0,
      couponCode,
      bookingReference,
      paymentMethod,
      source: source || "website",
      specialRequests,
      paymentStatus: "paid",
    });

    // Mark all rooms as occupied
    await Promise.all(
      roomList.map(
        (r) =>
          r.roomId && Room.findByIdAndUpdate(r.roomId, { status: "occupied" }),
      ),
    );

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

// GET /api/hotel-bookings?userId=
export const getMyHotelBookings = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const bookings = await HotelBooking.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate("hotelId", "name images location checkInTime checkOutTime")
      .sort({ bookedAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

// GET /api/hotel-bookings/:id
export const getHotelBookingById = async (req, res, next) => {
  try {
    const booking = await HotelBooking.findById(req.params.id).populate(
      "hotelId",
      "name images location",
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/hotel-bookings/:id/cancel
export const cancelHotelBooking = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;
    const booking = await HotelBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.bookingStatus === "cancelled")
      return res.status(400).json({ message: "Already cancelled" });

    booking.bookingStatus = "cancelled";
    booking.paymentStatus = "refunded";
    booking.cancellationReason = cancellationReason;
    booking.cancelledAt = new Date();

    // Refund policy by hours until check-in
    const hoursUntilCheckIn =
      (new Date(booking.checkIn).getTime() - Date.now()) / (1000 * 60 * 60);
    let refundPct = 0;
    if (hoursUntilCheckIn >= 48) refundPct = 100;
    else if (hoursUntilCheckIn >= 24) refundPct = 50;
    // else 0 — no refund within 24 hrs

    await booking.save();

    // Free up rooms
    const roomIds = booking.rooms?.length
      ? booking.rooms.map((r) => r.roomId)
      : [booking.roomId];
    await Promise.all(
      roomIds
        .filter(Boolean)
        .map((rid) => Room.findByIdAndUpdate(rid, { status: "available" })),
    );

    // Refund to wallet
    const totalAmount = booking.pricing?.totalAmount ?? 0;
    const refundAmount = Math.round((totalAmount * refundPct) / 100);
    if (refundAmount > 0 && booking.paymentMethod === "wallet") {
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
          description: `Refund (${refundPct}%) — ${booking.hotelName ?? "Hotel booking"} cancelled`,
          bookingReference: booking.bookingReference,
        });
        await wallet.save();
      }
    }

    // Handle loyalty coins
    const coinsToClawback = Math.round(
      ((booking.coinsEarned ?? 0) * refundPct) / 100,
    );
    const coinsToReinstate = Math.round(
      ((booking.coinsRedeemed ?? 0) * refundPct) / 100,
    );
    await processLoyaltyCancellation(booking.userId.toString(), {
      bookingReference: booking.bookingReference,
      bookingType: "hotel",
      coinsEarned: booking.coinsEarned ?? 0,
      coinsRedeemed: booking.coinsRedeemed ?? 0,
      clawbackPct: refundPct,
    });

    res.json({
      ...booking.toObject(),
      refundAmount,
      refundPct,
      coinsToClawback,
      coinsToReinstate,
    });
  } catch (err) {
    next(err);
  }
};
