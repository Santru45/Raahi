import { PaymentMethod, BookingSource } from "./enums";
import { BookingGuest } from "./booking.model";


/** Sent to POST /api/hotel-bookings */
export interface CreateBookingDTO {
  hotelId:          string;
  roomId:           string;
  ratePlanId?:      string;
  checkIn:          string;   // "YYYY-MM-DD"
  checkOut:         string;
  numAdults:        number;
  numChildren:      number;
  guests:           BookingGuest[];
  walletAmountUsed: number;
  coinsRedeemed:    number;
  couponCode?:      string;
  paymentMethod:    PaymentMethod;
  source:           BookingSource;
  specialRequests?: string;
}

/** Sent to GET /api/hotels (search filters) */
export interface HotelSearchFilters {
  city?:         string;
  checkIn?:      string;
  checkOut?:     string;
  guests?:       number;
  minPrice?:     number;
  maxPrice?:     number;
  starRating?:   number;
  amenities?:    string[];
}