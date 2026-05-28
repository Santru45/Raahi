// src/app/shared/model/travel.model.ts

export interface TravelService {
  _id: string;
  type: 'flight' | 'train' | 'bus'; // Lowercase to match JSON
  operatorName: string;
  serviceNumber: string;
  from: string;
  to: string;
  schedule: {
    departureTime: string;
    arrivalTime: string;
    duration: string;
  };
  fare: number;
  marketRate: number;
  totalSeats: number;
  availableSeats: number;
  cabinClass: string;
  amenities: string[];
  taxPercent: number;
  isActive: boolean;
  bookedSeats?: Array<{ seatNumber: string; serviceId: string }>;
}

export interface TravelBooking {
  _id?: string;
  userId: string;
  serviceId: string;
  // This matches your flat snapshot in db.json
  serviceSnapshot: {
    type: string;
    operatorName: string;
    serviceNumber: string;
    from: string;
    to: string;
    departureTime: string;
    arrivalTime: string;
    cabinClass: string;
  };
  passengers: Array<{
    firstName: string;
    lastName: string;
    isPrimary: boolean;
    idType: string;
    idNumber: string;
    seatNumber: string;
    pnr: string;
    berthPreference?: string;
  }>;
  boardingPoint?: string;
  droppingPoint?: string;
  pricing: {
    baseAmount: number;
    taxAmount: number;
    discountAmount: number;
    loyaltyDiscount: number;
    totalAmount: number;
    marketRate: number;
    currency: string;
  };
  walletAmountUsed: number;
  coinsRedeemed: number;
  coinsEarned: number;
  couponCode: string | null;
  ticketId: string;
  bookingReference: string;
  bookingStatus: 'confirmed' | 'cancelled'; // Match lowercase JSON
  paymentStatus: 'paid' | 'pending';
  paymentMethod: string;
  bookedAt: string;
}

export interface TravelLocation {
  _id: string;
  name: string;
  code: string; // MAA, NDLS, CMBT etc.
  type: 'flight' | 'train' | 'bus';
  city: string;
}
