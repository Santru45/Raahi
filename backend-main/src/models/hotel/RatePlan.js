import { Schema, model } from 'mongoose';

const ratePlanSchema = new Schema(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    planName: { type: String, required: true },
    includesBreakfast: { type: Boolean, default: false },
    includesLunch: { type: Boolean, default: false },
    includesDinner: { type: Boolean, default: false },
    isRefundable: { type: Boolean, default: true },
    freeCancellationHours: { type: Number, default: 24 },
    description: String,
  },
  { timestamps: true },
);

export default model('RatePlan', ratePlanSchema, 'ratePlans');
