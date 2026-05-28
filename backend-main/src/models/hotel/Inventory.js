import { Schema, model } from 'mongoose';

const inventorySchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    date: { type: Date, required: true },
    totalRooms: { type: Number, required: true },
    bookedRooms: { type: Number, default: 0 },
    blockedRooms: { type: Number, default: 0 },
  },
  { timestamps: true },
);

inventorySchema.index({ roomId: 1, date: 1 }, { unique: true });

const pricingSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    date: { type: Date, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true },
);

pricingSchema.index({ roomId: 1, date: 1 }, { unique: true });

export const RoomInventory = model('RoomInventory', inventorySchema);
export const RoomPricing = model('RoomPricing', pricingSchema);
