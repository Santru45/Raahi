import { Schema, model } from 'mongoose';

const hotelSchema = new Schema(
  {
    name: { type: String, required: true },
    hotelType: { type: String, required: true },
    userRating: { type: Number, default: 0 },
    starRating: { type: Number, required: true },
    description: String,
    location: {
      address: String,
      city: { type: String, index: true },
      state: String,
      country: String,
      coordinates: { lat: Number, lng: Number },
    },
    contactPhone: String,
    contactEmail: String,
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '11:00' },
    amenities: [String],
    images: [String],
    seasonalMultiplier: { type: Number, default: 1 },
    taxPercent: { type: Number, default: 18 },
    marketRate: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default model('Hotel', hotelSchema, 'hotels');
