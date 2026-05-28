import Hotel from "../models/hotel/Hotel.js";
import mongoose from "mongoose";

// POST /api/hotel-catalog/validate-coupon
export const validateCoupon = async (req, res, next) => {
  try {
    const { couponCode, hotelId, roomType, nights } = req.body;
    if (!couponCode)
      return res
        .status(400)
        .json({ valid: false, message: "Coupon code is required." });

    const db = mongoose.connection.db;
    const offer = await db.collection("popularOffers").findOne({
      couponCode: { $regex: `^${couponCode.trim()}$`, $options: "i" },
    });

    if (!offer)
      return res.json({ valid: false, message: "Invalid coupon code." });
    if (!offer.isActive)
      return res.json({
        valid: false,
        message: "This coupon is no longer active.",
      });

    const today = new Date().toISOString().slice(0, 10);
    if (today < offer.validFrom)
      return res.json({
        valid: false,
        message: `Coupon is valid from ${offer.validFrom}.`,
      });
    if (today > offer.validTo)
      return res.json({ valid: false, message: "This coupon has expired." });

    if (nights < offer.minNights)
      return res.json({
        valid: false,
        message: `This coupon requires a minimum stay of ${offer.minNights} night(s). Your stay is ${nights} night(s).`,
      });

    // Check hotel eligibility: by explicit hotelId list
    if (offer.applicableHotelIds && offer.applicableHotelIds.length > 0) {
      const hotelObjId = new mongoose.Types.ObjectId(hotelId);
      const hotelMatch = offer.applicableHotelIds.some(
        (id) => id.toString() === hotelObjId.toString(),
      );
      if (!hotelMatch) {
        // Also check hotel type as fallback
        const hotel = await Hotel.findById(hotelId).select("hotelType").lean();
        const typeMatch =
          hotel && offer.applicableHotelTypes?.includes(hotel.hotelType);
        if (!typeMatch)
          return res.json({
            valid: false,
            message: "This coupon is not valid for the selected hotel.",
          });
      }
    }

    // Check room type eligibility
    if (offer.applicableRoomTypes && offer.applicableRoomTypes.length > 0) {
      const rtLower = (roomType || "").toLowerCase();
      const roomMatch = offer.applicableRoomTypes.some(
        (rt) => rt.toLowerCase() === rtLower,
      );
      if (!roomMatch)
        return res.json({
          valid: false,
          message: `This coupon applies to: ${offer.applicableRoomTypes.join(", ")} rooms only.`,
        });
    }

    return res.json({
      valid: true,
      discountPercent: offer.discountPercent,
      offerId: offer._id.toString(),
      minNights: offer.minNights,
      title: offer.title,
      message: `${offer.discountPercent}% off applied! ${offer.title}`,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/hotels/meta
export const getMeta = async (req, res, next) => {
  try {
    const [cities, amenities, hotelTypes] = await Promise.all([
      Hotel.distinct("location.city", { isActive: true }),
      Hotel.distinct("amenities", { isActive: true }),
      Hotel.distinct("hotelType", { isActive: true }),
    ]);
    res.json({ cities, amenities, hotelTypes });
  } catch (err) {
    next(err);
  }
};

// GET /api/hotels
export const getHotels = async (req, res, next) => {
  try {
    const { city, starRating, minPrice, maxPrice, amenities } = req.query;
    const filter = { isActive: true };

    if (city) filter["location.city"] = { $regex: city, $options: "i" };
    if (starRating) filter.starRating = Number(starRating);
    if (amenities) filter.amenities = { $all: amenities.split(",") };
    if (minPrice || maxPrice) {
      filter.marketRate = {};
      if (minPrice) filter.marketRate.$gte = Number(minPrice);
      if (maxPrice) filter.marketRate.$lte = Number(maxPrice);
    }

    const hotels = await Hotel.find(filter);
    res.json(hotels);
  } catch (err) {
    next(err);
  }
};

// GET /api/hotels/:id
export const getHotelById = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    res.json(hotel);
  } catch (err) {
    next(err);
  }
};

// POST /api/hotels (admin)
export const createHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.create(req.body);
    res.status(201).json(hotel);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/hotels/:id (admin)
export const updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    res.json(hotel);
  } catch (err) {
    next(err);
  }
};
