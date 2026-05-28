import Review from "../models/review/review.model.js";
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

const toObjectId = (id) => {
  try {
    return new ObjectId(id.toString());
  } catch {
    return id;
  }
};

const getUserId = (req) =>
  req.user?._id?.toString() ||
  req.params?.userId ||
  req.body?.userId ||
  req.query?.userId;

// GET /api/reviews?entityId=xxx  
export const getReviewsByHotel = async (req, res) => {
  try {
    const { entityId, userId, rating_gte } = req.query;

    // userId-only mode: used by recommendation service to get positive reviews
    if (!entityId && userId) {
      try {
        const filter = { userId: toObjectId(userId) };
        if (rating_gte) filter.rating = { $gte: Number(rating_gte) };
        const reviews = await Review.find(filter);
        return res.json(reviews);
      } catch {
        return res.json([]);
      }
    }

    if (!entityId)
      return res.status(400).json({ message: "entityId is required" });
// here all reviews are fetched and sorted by rating, then user names are populated in a single query to avoid N+1 problem. This is done because we want to show all reviews on the hotel page, and sorting by rating is a common requirement there. For other use cases (like showing only user's own review), the GET /api/reviews/user endpoint can be used which does not do sorting or user name population.
    const allReviews = await Review.find({ entityId: toObjectId(entityId) });

    const avgRating =
      allReviews.length > 0
        ? parseFloat(
            (
              allReviews.reduce((sum, r) => sum + r.rating, 0) /
              allReviews.length
            ).toFixed(1),
          )
        : 0;

    // Sort all reviews by rating (highest first)
    const sortedReviews = [...allReviews].sort((a, b) => b.rating - a.rating);
// get user collection from db
    const usersCollection = Review.db.collection("users");
    // get all the unique ids from all the reviews
    const userIds = [
      ...new Set(sortedReviews.map((r) => toObjectId(r.userId))),
    ];
    //  then get only those users data in a array whose review is there
    const users = await usersCollection
      .find({ _id: { $in: userIds } })
      .toArray();
// make a map with id as key and name as value for easy access
    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u.name;
    });
// make new array of reviews with name includes by matching userId from map
    const reviewsWithName = sortedReviews.map((r) => ({
      // spread operator is used to keep all the existing fields
      ...r.toObject(),
      name: userMap[r.userId?.toString()] ?? "Anonymous",
    }));

    res.json({ reviews: reviewsWithName, avgRating, total: allReviews.length });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/reviews/user?userId=xxx&entityId=xxx
export const getReviewByUserAndEntity = async (req, res) => {
  try {
    const { userId, entityId } = req.query;
    if (!userId || !entityId)
      return res
        .status(400)
        .json({ message: "userId and entityId are required" });

    const reviews = await Review.find({
      userId: toObjectId(userId),
      entityId: toObjectId(entityId),
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/reviews/validate?userId=xxx&hotelId=xxx
export const validateReviewEligibility = async (req, res) => {
  try {
    const { userId, hotelId } = req.query;
    if (!userId || !hotelId)
      return res
        .status(400)
        .json({ message: "userId and hotelId are required" });

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const bookingsCollection = Review.db.collection("hotelBookings");
    const bookings = await bookingsCollection
      .find({
        userId: toObjectId(userId),
        hotelId: toObjectId(hotelId),
        $or: [
          { bookingStatus: { $in: ["confirmed", "completed"] } },
          { checkIn: { $lte: today } }, // Check-in date is today or in the past
        ],
      })
      .toArray();

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/reviews
export const addReview = async (req, res) => {
  try {
    const userId = getUserId(req);
    const {
      entityId,
      entityType,
      rating,
      comment,
      year,
      images,
      isVerified,
      createdAt,
      subrating,
    } = req.body;

    const review = await Review.create({
      userId: toObjectId(userId),
      entityId: toObjectId(entityId),
      entityType,
      rating,
      comment,
      year,
      images,
      isVerified,
      createdAt,
      subrating,
    });

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: "Already reviewed" });
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/reviews/user/:userId/entity/:entityId
export const updateReview = async (req, res) => {
  try {
    const { userId, entityId } = req.params;
    const { rating, comment, images, subrating, entityType, year } = req.body;

    const review = await Review.findOneAndUpdate(
      { userId: toObjectId(userId), entityId: toObjectId(entityId) },
      {
        rating,
        comment,
        images,
        subrating,
        entityType,
        year,
        createdAt: new Date().toISOString(),
      },
      { new: true, runValidators: true },
    );

    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/reviews/:id
export const updateReviewById = async (req, res) => {
  try {
    const { rating, comment, images, subrating, entityType, year } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        rating,
        comment,
        images,
        subrating,
        entityType,
        year,
        createdAt: new Date().toISOString(),
      },
      { new: true, runValidators: true },
    );
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/reviews/hotel/:hotelId
export const getHotelById = async (req, res) => {
  try {
    const hotelsCollection = Review.db.collection("hotels");
    const hotel = await hotelsCollection.findOne({
      _id: toObjectId(req.params.hotelId),
    });
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    res.json([hotel]);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
