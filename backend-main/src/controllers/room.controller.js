import Room from "../models/hotel/Room.js";
import RatePlan from "../models/hotel/RatePlan.js";
import HotelBooking from "../models/hotel/HotelBooking.js";

// ── ROOMS ─────────────────────────────────────────────────────

// GET /api/rooms?hotelId=
export const getRooms = async (req, res, next) => {
  try {
    const { hotelId } = req.query;
    const filter = hotelId ? { hotelId } : {};
    const rooms = await Room.find(filter);
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

// GET /api/rooms/available?hotelId=&checkIn=&checkOut=
// Returns rooms not booked during the date range (ignores cancelled bookings)
export const getAvailableRooms = async (req, res, next) => {
  try {
    const { hotelId, checkIn, checkOut } = req.query;
    if (!hotelId || !checkIn || !checkOut) {
      return res
        .status(400)
        .json({ message: "hotelId, checkIn, checkOut are required" });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Find all rooms for this hotel
    const allRooms = await Room.find({ hotelId });
    const allRoomIds = allRooms.map((r) => r._id);

    // Find room IDs that have overlapping active bookings
    // Overlap: booking.checkIn < requested.checkOut AND booking.checkOut > requested.checkIn
    // Check both legacy roomId field and new rooms array
    const overlappingBookings = await HotelBooking.find({
      $or: [
        { roomId: { $in: allRoomIds } },
        { "rooms.roomId": { $in: allRoomIds } },
      ],
      bookingStatus: { $nin: ["cancelled"] },
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    }).select("roomId rooms");

    const bookedRoomIds = new Set();
    overlappingBookings.forEach((b) => {
      // Legacy single room
      if (b.roomId) {
        bookedRoomIds.add(b.roomId.toString());
      }
      // New multi-room array
      if (b.rooms && b.rooms.length > 0) {
        b.rooms.forEach((r) => {
          if (r.roomId) bookedRoomIds.add(r.roomId.toString());
        });
      }
    });

    // Return rooms not in the booked set
    const availableRooms = allRooms.filter(
      (r) => !bookedRoomIds.has(r._id.toString()),
    );

    res.json(availableRooms);
  } catch (err) {
    next(err);
  }
};

// GET /api/rooms/:id
export const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    next(err);
  }
};

// POST /api/rooms (admin)
export const createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/rooms/:id/status
export const updateRoomStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    next(err);
  }
};

// ── RATE PLANS ────────────────────────────────────────────────

// GET /api/rate-plans?hotelId=
export const getRatePlans = async (req, res, next) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId)
      return res.status(400).json({ message: "hotelId is required" });
    const plans = await RatePlan.find({ hotelId });
    res.json(plans);
  } catch (err) {
    next(err);
  }
};

// POST /api/rate-plans (admin)
export const createRatePlan = async (req, res, next) => {
  try {
    const plan = await RatePlan.create(req.body);
    res.status(201).json(plan);
  } catch (err) {
    next(err);
  }
};
