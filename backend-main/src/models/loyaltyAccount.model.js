// src/models/loyaltyAccount.model.js
import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema(
  {
    _id: { type: String },
    bookingReference: { type: String },
    bookingType: { type: String },
    action: {
      type: String,
      enum: ['earned', 'redeemed', 'clawback', 'refunded'],
    },
    coins: { type: Number },
    balanceAfter: { type: Number },
    expiresAt: { type: String },
    note: { type: String },
  },
  { _id: false },
);

const loyaltyAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    coinBalance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    tier: { type: String, default: 'bronze' },
    earnMultiplier: { type: Number, default: 1 },
    maxRedeemPercent: { type: Number, default: 10 },
    nextTierAt: { type: Number, default: 200 },
    ledger: { type: [ledgerEntrySchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model(
  'LoyaltyAccount',
  loyaltyAccountSchema,
  'loyaltyAccounts',
);
