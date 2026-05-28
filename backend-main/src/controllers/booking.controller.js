import mongoose from "mongoose";
import HotelBooking from "../models/hotelBooking.model.js";
import TravelBooking from "../models/travelBooking.model.js";

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Fetch travel service by id
const findTravelService = (serviceId) =>
  mongoose.connection.collection("travelServices").findOne({
    _id: new mongoose.Types.ObjectId(serviceId.toString()),
  });

// Build service snapshot
const buildSnapshot = (svc) => ({
  type: svc.type,
  operatorName: svc.operatorName,
  serviceNumber: svc.serviceNumber,
  from: svc.from,
  to: svc.to,
  departureTime: svc.schedule?.departureTime,
  arrivalTime: svc.schedule?.arrivalTime,
  cabinClass: svc.cabinClass,
});

// Backfill missing serviceSnapshot from DB
const enrichTravelBookings = async (bookings) =>
  Promise.all(
    bookings.map(async (b) => {
      const obj = b.toObject ? b.toObject() : b;
      if (!obj.serviceSnapshot && obj.serviceId) {
        const svc = await findTravelService(obj.serviceId);
        if (svc) obj.serviceSnapshot = buildSnapshot(svc);
      }
      return obj;
    }),
  );

// â”€â”€ Admin controllers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getAllHotelBookings = async (_req, res) => {
  try {
    res.json(await HotelBooking.find());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllTravelBookings = async (_req, res) => {
  try {
    const bookings = await TravelBooking.find();
    res.json(await enrichTravelBookings(bookings));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// â”€â”€ User controllers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const createHotelBooking = async (req, res) => {
  try {
    const booking = await new HotelBooking(req.body).save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateHotelBooking = async (req, res) => {
  try {
    const updated = await HotelBooking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updated) return res.status(404).json({ message: "Booking not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getHotelBookingsByUser = async (req, res) => {
  try {
    const bookings = await HotelBooking.find({
      userId: new mongoose.Types.ObjectId(req.params.userId),
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTravelBookingsByUser = async (req, res) => {
  try {
    const bookings = await TravelBooking.find({
      userId: req.params.userId,
    });
    res.json(await enrichTravelBookings(bookings));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Merge hotel and travel bookings for user timeline
export const getAllBookingsForUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const hotelUserId = new mongoose.Types.ObjectId(userId);
    const [hotelBookings, travelBookingsRaw, hotels] = await Promise.all([
      HotelBooking.find({ userId: hotelUserId }),
      TravelBooking.find({ userId: userId }),
      mongoose.connection.collection("hotels").find({}).toArray(),
    ]);

    const travelBookings = await enrichTravelBookings(travelBookingsRaw);
    const hotelMap = new Map(hotels.map((h) => [h._id.toString(), h.name]));

    const getStatus = (dateStr, bookingStatus) => {
      if (bookingStatus === "cancelled") return "cancelled";
      return new Date(dateStr) > new Date() ? "upcoming" : "completed";
    };

    const formatted = [
      ...hotelBookings.map((b) => ({
        bookingReference: b.bookingReference,
        type: "hotel",
        destination: hotelMap.get(b.hotelId?.toString()) ?? "Hotel Stay",
        startDate: b.checkIn,
        endDate: b.checkOut,
        status: getStatus(b.checkIn, b.bookingStatus),
        bookedAt: b.bookedAt,
      })),
      ...travelBookings.map((b) => ({
        bookingReference: b.bookingReference,
        type: b.serviceSnapshot?.type,
        destination: b.serviceSnapshot?.to,
        startDate: b.bookedAt,
        endDate: b.bookedAt,
        status: getStatus(b.bookedAt, b.bookingStatus),
        bookedAt: b.bookedAt,
      })),
    ].sort(
      (a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime(),
    );

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
