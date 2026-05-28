import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    _id: { type: String },
    type: { type: String, enum: ['topup', 'debit', 'refund'], required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String },
    bookingReference: { type: String, default: null },
  },
  { _id: false },
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // ← changed from String to ObjectId
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    isActive: { type: Boolean, default: true },
    transactions: { type: [transactionSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model('Wallet', walletSchema, 'virtualWallets');
