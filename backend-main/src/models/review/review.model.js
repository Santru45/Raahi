import mongoose from 'mongoose';

const subRatingsSchema = new mongoose.Schema(
  {
    cleanliness: { type: Number, default: 0 },
    service: { type: Number, default: 0 },
    location: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    facilities: { type: Number, default: 0 },
    staff: { type: Number, default: 0 },
  },
  { _id: false },
);

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    entityType: { type: String, required: true, default: 'hotel' },
    rating: { type: Number, required: true, min: 0, max: 5 },
    comment: { type: String, required: true },
    year: { type: Number, required: true },
    images: { type: [String], default: [] },
    isVerified: { type: Boolean, default: true },
    createdAt: { type: String },
    subrating: { type: subRatingsSchema, default: () => ({}) },
  },
  { timestamps: false },
);

// one review per user per hotel
reviewSchema.index({ userId: 1, entityId: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema, 'reviews');
