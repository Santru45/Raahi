import mongoose from 'mongoose';
import HotelBooking from '../models/hotelBooking.model.js';
import TravelBooking from '../models/travelBooking.model.js';
import { userModel } from '../models/user.model.js';

// Helper
const getHotelCollection = () => mongoose.connection.collection('hotels');

const findTravelService = (serviceId) =>
  mongoose.connection.collection('travelServices').findOne({
    _id: new mongoose.Types.ObjectId(serviceId.toString()),
  });

const enrichSnapshot = async (booking) => {
  const obj = booking.toObject ? booking.toObject() : booking;
  if (!obj.serviceSnapshot && obj.serviceId) {
    const svc = await findTravelService(obj.serviceId);
    if (svc) {
      obj.serviceSnapshot = {
        type: svc.type,
        operatorName: svc.operatorName,
        serviceNumber: svc.serviceNumber,
        from: svc.from,
        to: svc.to,
      };
    }
  }
  return obj;
};

// GET /api/admin/stats
export const getDashboardStats = async (_req, res) => {
  try {
    const [hotelBookings, travelBookingsRaw, users] = await Promise.all([
      HotelBooking.find().lean(),
      TravelBooking.find(),
      userModel.find({}, { passwordHash: 0, __v: 0 }).lean(),
    ]);

    const travelBookings = await Promise.all(
      travelBookingsRaw.map(enrichSnapshot),
    );

    const totalCustomers = users.filter((u) => u.role === 'customer').length;
    const totalAdmins = users.filter((u) => u.role === 'admin').length;
    const activeUsers = users.filter((u) => u.isActive === true).length;
    const totalBookings = hotelBookings.length + travelBookings.length;

    const revenue = [...hotelBookings, ...travelBookings].reduce(
      (t, b) => t + (b.pricing?.totalAmount || 0),
      0,
    );
    const hotelRevenue = hotelBookings.reduce(
      (t, b) => t + (b.pricing?.totalAmount || 0),
      0,
    );
    const flightRevenue = travelBookings
      .filter((b) => b.serviceSnapshot?.type === 'flight')
      .reduce((t, b) => t + (b.pricing?.totalAmount || 0), 0);
    const trainRevenue = travelBookings
      .filter((b) => b.serviceSnapshot?.type === 'train')
      .reduce((t, b) => t + (b.pricing?.totalAmount || 0), 0);

    const cancelledCount = [...hotelBookings, ...travelBookings].filter(
      (b) => b.bookingStatus === 'cancelled',
    ).length;
    const cancellationRate =
      totalBookings > 0
        ? Math.round((cancelledCount / totalBookings) * 100)
        : 0;
    const avgBookingsPerCustomer =
      totalCustomers > 0
        ? Math.round((totalBookings / totalCustomers) * 10) / 10
        : 0;

    res.json({
      totalUsers: users.length,
      hotelBookings: hotelBookings.length,
      flightBookings: travelBookings.length,
      revenue,
      totalCustomers,
      totalAdmins,
      activeUsers,
      totalBookings,
      hotelRevenue,
      flightRevenue,
      trainRevenue,
      users: users.filter((u) => u.role === 'customer'),
      cancellationRate,
      avgBookingsPerCustomer,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/recent-bookings
export const getRecentBookings = async (_req, res) => {
  try {
    const [hotelBookings, travelBookingsRaw, users, hotels] = await Promise.all(
      [
        HotelBooking.find().lean(),
        TravelBooking.find(),
        userModel.find({}, { passwordHash: 0, __v: 0 }).lean(),
        getHotelCollection().find({}).toArray(),
      ],
    );

    const travelBookings = await Promise.all(
      travelBookingsRaw.map(enrichSnapshot),
    );

    const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));
    const hotelMap = new Map(
      hotels.map((h) => [h._id.toString(), h.location?.city || h.name]),
    );

    const hotelSummaries = hotelBookings.map((b) => ({
      userId: b.userId?.toString(),
      bookingReference: b.bookingReference,
      destination: hotelMap.get(b.hotelId?.toString()) ?? b._id?.toString(),
      type: 'hotel',
      amount: b.pricing?.totalAmount || 0,
      bookingStatus: b.bookingStatus,
      bookedAt: b.bookedAt,
      userName: userMap.get(b.userId?.toString()) ?? b.userId?.toString(),
    }));

    const travelSummaries = travelBookings.map((b) => ({
      userId: b.userId?.toString(),
      bookingReference: b.bookingReference,
      destination: b.serviceSnapshot?.to || 'Unknown',
      type: b.serviceSnapshot?.type || 'flight',
      amount: b.pricing?.totalAmount || 0,
      bookingStatus: b.bookingStatus,
      bookedAt: b.bookedAt,
      userName: userMap.get(b.userId?.toString()) ?? b.userId?.toString(),
    }));

    const all = [...hotelSummaries, ...travelSummaries].sort(
      (a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime(),
    );

    res.json(all);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/users
export const getUsers = async (_req, res) => {
  try {
    const users = await userModel
      .find({ role: 'customer' }, { passwordHash: 0, __v: 0 })
      .lean();

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/top-hotels
export const getTopHotels = async (_req, res) => {
  try {
    const [hotels, hotelBookings] = await Promise.all([
      getHotelCollection().find({}).toArray(),
      HotelBooking.find().lean(),
    ]);

    const result = hotels
      .map((hotel) => {
        const hid = hotel._id.toString();
        const bookings = hotelBookings.filter(
          (b) => b.hotelId?.toString() === hid,
        );
        const revenue = bookings.reduce(
          (t, b) => t + (b.pricing?.totalAmount || 0),
          0,
        );
        return {
          name: hotel.name,
          starRating: hotel.starRating,
          bookingCount: bookings.length,
          revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .filter((a) => a.revenue > 0);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
