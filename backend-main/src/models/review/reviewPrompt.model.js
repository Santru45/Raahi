import mongoose from 'mongoose';

const reviewPromptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    hotelName: { type: String, default: '' },
    hotelType: { type: String, default: '' },
    bookingReference: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'dismissed', 'reviewed'],
      default: 'pending',
    },
    nudgeCount: { type: Number, default: 0 },
    maxNudges: { type: Number, default: 3 },
  },
  { timestamps: true },
);

reviewPromptSchema.index({ userId: 1, hotelId: 1 }, { unique: true });

export default mongoose.model(
  'ReviewPrompt',
  reviewPromptSchema,
  'reviewPrompts',
);
