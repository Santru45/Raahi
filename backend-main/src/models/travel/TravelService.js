import mongoose from 'mongoose';

const travelServiceSchema = new mongoose.Schema({
  type: { type: String, enum: ['flight', 'train', 'bus'], required: true },
  operatorName: { type: String, required: true },
  serviceNumber: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  schedule: {
    departureTime: Date,
    arrivalTime: Date,
    duration: String,
  },
  fare: { type: Number, required: true },
  marketRate: Number,
  totalSeats: Number,
  availableSeats: Number,
  cabinClass: String,
  amenities: [String],
  taxPercent: Number,
  isActive: { type: Boolean, default: true },
});

export default mongoose.model(
  'TravelService',
  travelServiceSchema,
  'travelServices',
);
