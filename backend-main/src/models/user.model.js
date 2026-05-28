import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, required: true },
    role: {
      type: String,
      required: true,
      default: 'customer',
      enum: ['admin', 'customer'],
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    loyaltyAccountId: {
      type: String,
      required: true,
    },
    otpHash: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const userModel = mongoose.model('User', userSchema);
