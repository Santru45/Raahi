import { userModel } from "../models/user.model.js";
import HotelBooking from "../models/hotel/HotelBooking.js";
import TravelBooking from "../models/travel/TravelBooking.js";
import LoyaltyAccount from "../models/loyaltyAccount.model.js";
import Wallet from "../models/wallet.model.js";
import Review from "../models/review/review.model.js";
import ReviewPrompt from "../models/review/reviewPrompt.model.js";
import Itinerary from "../models/itinerary/Itinerary.js";
import ItineraryItem from "../models/itinerary/ItineraryItem.js";
import mongoose from "mongoose";

// Exclude sensitive fields from all user queries
const HIDDEN_FIELDS = { passwordHash: 0, __v: 0 };

export const getAllUsers = async (_req, res) => {
  try {
    res.json(await userModel.find({}, HIDDEN_FIELDS));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Delete hotel bookings
    await HotelBooking.deleteMany({ userId: new mongoose.Types.ObjectId(id) });

    // 2. Delete travel bookings (userId stored as String)
    await TravelBooking.deleteMany({ userId: id });

    // 3. Delete loyalty account
    await LoyaltyAccount.deleteMany({
      userId: new mongoose.Types.ObjectId(id),
    });

    // 4. Delete virtual wallet
    await Wallet.deleteMany({ userId: new mongoose.Types.ObjectId(id) });

    // 5. Delete reviews
    await Review.deleteMany({ userId: new mongoose.Types.ObjectId(id) });

    // 6. Delete review prompts
    await ReviewPrompt.deleteMany({ userId: new mongoose.Types.ObjectId(id) });

    // 7. Delete itinerary items belonging to user's itineraries, then itineraries
    const itineraries = await Itinerary.find({ user_id: id }).select("_id");
    if (itineraries.length > 0) {
      const itnIds = itineraries.map((i) => i._id.toString());
      await ItineraryItem.deleteMany({ itinerary_id: { $in: itnIds } });
      await Itinerary.deleteMany({ user_id: id });
    }

    // 8. Finally delete the user
    await userModel.findByIdAndDelete(id);

    res.json({
      message: "User and all associated data deleted successfully.",
      id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id, HIDDEN_FIELDS);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    // Never allow role or passwordHash to be changed via this route
    const { passwordHash: _p, role: _r, ...safeFields } = req.body;
    const updated = await userModel.findByIdAndUpdate(
      req.params.id,
      safeFields,
      { new: true, runValidators: true, projection: HIDDEN_FIELDS },
    );
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email)
      return res.status(400).json({ message: "email query param required" });
    const user = await userModel.findOne({ email }, HIDDEN_FIELDS);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
