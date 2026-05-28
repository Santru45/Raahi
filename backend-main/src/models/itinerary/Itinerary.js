import mongoose from 'mongoose';

const itinerarySchema = new mongoose.Schema(
  {
    _id: { type: String },
    user_id: { type: String, default: null },
    trip_name: {
      type: String,
      required: [true, 'Trip name is required'],
      trim: true,
      minlength: [3, 'Trip name must be at least 3 characters'],
    },
    start_date: { type: String, default: null },
    end_date: { type: String, default: null },
    destination: { type: String, default: null },
    type: {
      type: String,
      enum: ['std', 'custom'],
      required: [true, 'Type is required'],
      default: 'custom',
    },
    images: {
      type: [String],
      default: [
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
      ],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

export default mongoose.model('Itinerary', itinerarySchema, 'itineraries');
