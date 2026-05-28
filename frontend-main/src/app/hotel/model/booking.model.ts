import { RoomDetails, RatePlan, } from "./hotel.model";
import { BookingStatus, PaymentStatus, PaymentMethod, BookingSource } from "./enums";

// ── PRICING ──────────────────────────────────────────────────

export interface Pricing {
  baseAmount:      number;
  taxAmount:       number;
  discountAmount:  number;
  loyaltyDiscount: number;
  totalAmount:     number;
  marketRate?:     number;
  currency:        string;   // "INR"
}

// ── BOOKING GUEST ────────────────────────────────────────────

export interface BookingGuest {
  firstName:  string;
  lastName:   string;
  isPrimary:  boolean;
  idType?:    string;   // "Aadhaar", "Passport", "PAN"
  idNumber?:  string;
}

// ── HOTEL BOOKING ────────────────────────────────────────────

export interface HotelBooking {
  _id:               string;
  userId:            string;
  hotelId:           string;
  roomId:            string;
  roomSnapshot:      Partial<RoomDetails>;   // frozen copy at booking time
  ratePlanId?:       string;
  ratePlanSnapshot:  Partial<RatePlan>;      // frozen copy at booking time
  checkIn:           Date;
  checkOut:          Date;
  numNights:         number;
  numAdults:         number;
  numChildren:       number;
  guests:            BookingGuest[];
  pricing:           Pricing;
  walletAmountUsed:  number;
  coinsRedeemed:     number;
  coinsEarned:       number;
  couponCode?:       string;
  checkInId?:        string;
  bookingReference:  string;
  bookingStatus:     BookingStatus;
  paymentStatus:     PaymentStatus;
  paymentMethod?:    PaymentMethod;
  source:            BookingSource;
  specialRequests?:  string;
  cancellationReason?: string;
  cancelledAt?:      Date;
  bookedAt:          Date;
}