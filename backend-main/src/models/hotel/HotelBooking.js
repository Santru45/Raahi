import { Schema, model } from "mongoose";

const guestSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, default: "" },
    isPrimary: { type: Boolean, default: false },
    idType: String,
    idNumber: String,
  },
  { _id: false },
);

const pricingSchema = new Schema(
  {
    baseAmount: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    loyaltyDiscount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    marketRate: Number,
    currency: { type: String, default: "INR" },
  },
  { _id: false },
);

const roomItemSchema = new Schema(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room" },
    roomType: String,
    bedType: String,
    pricePerNight: Number,
  },
  { _id: false },
);

const hotelBookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    hotelId: { type: Schema.Types.ObjectId, ref: "Hotel", required: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", default: null }, // Legacy single room
    rooms: [roomItemSchema], // Multi-room support
    hotelName: String,
    roomSnapshot: { type: Schema.Types.Mixed },
    ratePlanSnapshot: { type: Schema.Types.Mixed },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    numNights: { type: Number, required: true },
    numAdults: { type: Number, required: true },
    numChildren: { type: Number, default: 0 },
    guests: [guestSchema],
    pricing: pricingSchema,
    walletAmountUsed: { type: Number, default: 0 },
    coinsRedeemed: { type: Number, default: 0 },
    coinsEarned: { type: Number, default: 0 },
    couponCode: String,
    bookingReference: { type: String, unique: true },
    bookingStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "no_show",
        "completed",
      ],
      default: "confirmed",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partially_paid", "paid", "refunded"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: [
        "wallet",
        "razorpay",
        "upi",
        "credit_card",
        "debit_card",
        "netbanking",
        "cash",
      ],
    },
    source: {
      type: String,
      enum: ["website", "app", "walkin", "phone"],
      default: "website",
    },
    specialRequests: String,
    cancellationReason: String,
    cancelledAt: Date,
    bookedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

hotelBookingSchema.pre("save", async function () {
  if (!this.bookingReference) {
    this.bookingReference = "BK" + Date.now().toString(36).toUpperCase();
  }
});

export default model("HotelBooking", hotelBookingSchema, "hotelBookings");
