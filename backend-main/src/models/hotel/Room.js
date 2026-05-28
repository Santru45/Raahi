import { Schema, model } from 'mongoose';

const roomSchema = new Schema(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    roomNumber: { type: String, required: true },
    type: {
      type: String,
      enum: ['standard', 'deluxe', 'suite', 'executive'],
      required: true,
    },
    bedType: {
      type: String,
      enum: ['single', 'double', 'twin', 'queen', 'king'],
      required: true,
    },
    maxOccupancy: { type: Number, required: true },
    basePricePerNight: { type: Number, required: true },
    floorNumber: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'blocked'],
      default: 'available',
    },
    amenities: [String],
    images: [String],
  },
  { timestamps: true },
);

export default model('Room', roomSchema, 'rooms');
