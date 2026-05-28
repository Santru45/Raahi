import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  isPrimary: { type: Boolean, default: false },
  idType: String,
  idNumber: String,
  seatNumber: String,
  pnr: String,
  berthPreference: String,
  gender: { type: String, enum: ["male", "female"], default: "male" },
});

const pricingSchema = new mongoose.Schema({
  baseAmount: Number,
  taxAmount: Number,
  discountAmount: { type: Number, default: 0 },
  loyaltyDiscount: { type: Number, default: 0 },
  totalAmount: Number,
  marketRate: Number,
  currency: { type: String, default: "INR" },
});

const serviceSnapshotSchema = new mongoose.Schema({
  type: String,
  operatorName: String,
  serviceNumber: String,
  from: String,
  to: String,
  departureTime: String,
  arrivalTime: String,
  cabinClass: String,
});

const travelBookingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  serviceId: { type: String, required: true },
  bookingReference: { type: String, required: true, unique: true },
  ticketId: String,
  serviceSnapshot: serviceSnapshotSchema,
  passengers: [passengerSchema],
  boardingPoint: String,
  dropPoint: String,
  pricing: pricingSchema,
  walletAmountUsed: Number,
  paymentMethod: { type: String, default: "wallet" },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "paid",
  },
  bookingStatus: {
    type: String,
    enum: ["confirmed", "cancelled"],
    default: "confirmed",
  },
  coinsRedeemed: { type: Number, default: 0 },
  coinsEarned: { type: Number, default: 0 },
  couponCode: String,
  cancellationReason: String,
  cancelledAt: Date,
  bookedAt: { type: Date, default: Date.now },
});

export default mongoose.model(
  "TravelBooking",
  travelBookingSchema,
  "travelBookings",
);
