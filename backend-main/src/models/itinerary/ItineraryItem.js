import mongoose from 'mongoose';

const itineraryItemSchema = new mongoose.Schema(
  {
    _id: { type: String },
    itinerary_id: {
      type: String,
      required: [true, 'itinerary_id is required'],
    },
    category: {
      type: String,
      enum: ['travel', 'hotel', 'activity'],
      required: [true, 'Category is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    date: { type: String, default: null },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'confirmed',
    },
    sort_order: { type: Number, default: null },
    source_booking_ref: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

export default mongoose.model(
  'ItineraryItem',
  itineraryItemSchema,
  'itineraryItems',
);
