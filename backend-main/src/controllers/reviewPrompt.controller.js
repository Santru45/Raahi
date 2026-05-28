import ReviewPrompt from '../models/review/reviewPrompt.model.js';
import Review from '../models/review/review.model.js';
import mongoose from 'mongoose';

const { ObjectId } = mongoose.Types;

const toObjectId = (id) => {
  try {
    return new ObjectId(id.toString());
  } catch {
    return id;
  }
};

const getUserId = (req) =>
  req.user?._id?.toString() || req.params?.userId || req.query?.userId;

// GET /api/prompts/:userId
export const getPrompts = async (req, res) => {
  try {
    const userId = getUserId(req);
    const db = req.app.locals.db;
    const todayString = new Date().toISOString().split('T')[0];

    const completedBookings = await db
      .collection('hotelBookings')
      .find({
        userId: toObjectId(userId),
        bookingStatus: { $nin: ['cancelled'] },
        checkOut: { $lt: todayString },
      })
      .toArray();

    for (const booking of completedBookings) {
      const alreadyReviewed = await Review.findOne({
        userId: toObjectId(userId),
        entityId: toObjectId(booking.hotelId),
      });
      if (alreadyReviewed) continue;

      const promptExists = await ReviewPrompt.findOne({
        userId: toObjectId(userId),
        hotelId: toObjectId(booking.hotelId),
      });
      if (promptExists) continue;

      const hotel = await db
        .collection('hotels')
        .findOne({ _id: toObjectId(booking.hotelId) });

      await ReviewPrompt.create({
        userId: toObjectId(userId),
        hotelId: toObjectId(booking.hotelId),
        hotelName: hotel?.name ?? booking.hotelName ?? 'Hotel',
        hotelType: hotel?.hotelType ?? '',
        bookingReference: booking.bookingReference,
        status: 'pending',
        nudgeCount: 0,
      });
    }

    const pendingPrompts = await ReviewPrompt.find({
      userId: toObjectId(userId),
      status: 'pending',
    }).sort({ nudgeCount: 1 });

    if (pendingPrompts.length > 0) {
      const firstPrompt = pendingPrompts[0];
      firstPrompt.nudgeCount += 1;
      if (firstPrompt.nudgeCount >= firstPrompt.maxNudges) {
        firstPrompt.status = 'dismissed';
      }
      await firstPrompt.save();
    }

    const activeFirst = pendingPrompts.find((p) => p.status === 'pending');
    res.json(activeFirst ? [activeFirst] : []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/prompts/:promptId/dismiss
export const dismissPrompt = async (req, res) => {
  try {
    const prompt = await ReviewPrompt.findByIdAndUpdate(
      req.params.promptId,
      { status: 'dismissed' },
      { new: true },
    );
    if (!prompt) return res.status(404).json({ message: 'Prompt not found' });
    res.json({ message: 'Prompt dismissed', prompt });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/prompts/:promptId/reviewed
export const markReviewed = async (req, res) => {
  try {
    const prompt = await ReviewPrompt.findByIdAndUpdate(
      req.params.promptId,
      { status: 'reviewed' },
      { new: true },
    );
    if (!prompt) return res.status(404).json({ message: 'Prompt not found' });
    res.json({ message: 'Prompt marked as reviewed', prompt });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
