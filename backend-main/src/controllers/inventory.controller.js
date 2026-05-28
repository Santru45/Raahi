import { RoomInventory, RoomPricing } from '../models/hotel/Inventory.js';

// GET /api/inventory/availability?roomId=&checkIn=&checkOut=
export const checkAvailability = async (req, res, next) => {
  try {
    const { roomId, checkIn, checkOut } = req.query;
    const records = await RoomInventory.find({
      roomId,
      date: { $gte: new Date(checkIn), $lt: new Date(checkOut) },
    });
    const isAvailable = records.every(
      (r) => r.totalRooms - r.bookedRooms - r.blockedRooms > 0,
    );
    res.json({ isAvailable, records });
  } catch (err) {
    next(err);
  }
};

// GET /api/inventory/pricing?roomId=&checkIn=&checkOut=
export const getPricing = async (req, res, next) => {
  try {
    const { roomId, checkIn, checkOut } = req.query;
    const prices = await RoomPricing.find({
      roomId,
      date: { $gte: new Date(checkIn), $lt: new Date(checkOut) },
    });
    res.json(prices);
  } catch (err) {
    next(err);
  }
};

// POST /api/inventory (admin)
export const upsertInventory = async (req, res, next) => {
  try {
    const { hotelId, roomId, date, totalRooms, blockedRooms } = req.body;
    const record = await RoomInventory.findOneAndUpdate(
      { roomId, date: new Date(date) },
      { hotelId, totalRooms, blockedRooms },
      { upsert: true, new: true },
    );
    res.json(record);
  } catch (err) {
    next(err);
  }
};
