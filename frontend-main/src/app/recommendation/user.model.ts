
 export function normalizeId<T extends { id?: string; _id?: string }>(obj: T): T {
  return { ...obj, id: obj.id ?? obj._id ?? '' };
}

export function normalizeIds<T extends { id?: string; _id?: string }>(arr: T[]): T[] {
  return arr.map(normalizeId);
}
export interface Reviewwithname extends Review{
name:string;
}
export interface Subratings{
  "cleanliness":number;
  "service":number;
  "location":number;
  "food":number;
  "facilities":number;
  "staff":number;
}
export interface Review {
  id: string;
  _id?:string;
  userId: string;
  entityId: string;
  entityType: string;
  rating: number;
  images?: string[];
  comment: string;
  year: number;
  isVerified: boolean;
  createdAt: string;
  subrating: Subratings;
}
export interface User {
  _id?:string;
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: 'customer' | 'admin';
  loyaltyAccountId: string;
  isActive: boolean;
}
// export interface Hotel {
//   id: string;
//   name: string;
//   starRating: number;
//   hotelType:string,
//   location: Location;
//   amenities: string[];
//   images: string[];
//   rooms: Room[];
//   ratePlans: RatePlan[];
//   seasonalMultiplier: number;
//   taxPercent: number;
//   marketRate: number;
//   isActive: boolean;
// }

export interface Location {
  address: string;
  city: string;
  state: string;
  country: string;
  coordinates: Coordinates;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Room {
  _id?:string;
  id: string;
  roomNumber: string;
  type: string;
  bedType: string;
  maxOccupancy: number;
  basePricePerNight: number;
  floorNumber: number;
  status: 'available' | 'booked' | 'maintenance'; // restrict to known statuses
  amenities: string[];
}

export interface RatePlan {
  id: string;
  planName: string;
  includesBreakfast: boolean;
  includesLunch: boolean;
  includesDinner: boolean;
  isRefundable: boolean;
  freeCancellationHours: number;
}

export interface Guest {
  firstName: string;
  lastName: string;
  isPrimary: boolean;
  idType: string;
  idNumber: string;
}

export interface RoomSnapshot {
  roomNumber: string;
  type: string;
  bedType: string;
  maxOccupancy: number;
  basePricePerNight: number;
}

export interface RatePlanSnapshot {
  planName: string;
  includesBreakfast: boolean;
  isRefundable: boolean;
  freeCancellationHours: number;
}

export interface Pricing {
  baseAmount: number;
  taxAmount: number;
  discountAmount: number;
  loyaltyDiscount: number;
  totalAmount: number;
  marketRate: number;
  currency: string;
}

export interface HotelBooking {
  _id?:string;
  id: string;
  userId: string;
  hotelId: string;
  roomId: string;
  roomSnapshot: RoomSnapshot;
  ratePlanId: string;
  ratePlanSnapshot: RatePlanSnapshot;
  checkIn: string;   // ISO date string
  checkOut: string;  // ISO date string
  numNights: number;
  numAdults: number;
  numChildren: number;
  guests: Guest[];
  pricing: Pricing;
  walletAmountUsed: number;
  coinsRedeemed: number;
  coinsEarned: number;
  couponCode: string | null;
  checkInId: string;
  bookingReference: string;
  bookingStatus: "confirmed" | "pending" | "cancelled"; // restrict to known statuses
  paymentStatus: "paid" | "unpaid" | "refunded";
  paymentMethod: string;
  source: string;
  bookedAt: string; // ISO date string
}
export type HotelType = 'resort' | 'villa' | 'boutique' | 'palace' | 'heritage' | 'luxury' | 'business';

export interface Hotel{
  _id?:string;
  id: string;
  name: string;
  starRating: number;
  hotelType: HotelType;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  amenities: string[];
  images: string[];
  rooms: Room[];
  ratePlans: RatePlan[];
  seasonalMultiplier: number;
  taxPercent: number;
  marketRate: number;
  isActive: boolean;
}

export interface Room {
  id: string;
  roomNumber: string;
  type: string;
  bedType: string;
  maxOccupancy: number;
  basePricePerNight: number;
  floorNumber: number;
  status: 'available' | 'booked' | 'maintenance';
  amenities: string[];
}

export interface RatePlan {
  id: string;
  planName: string;
  includesBreakfast: boolean;
  includesLunch: boolean;
  includesDinner: boolean;
  isRefundable: boolean;
  freeCancellationHours: number;
}
 

export interface Offer {
   _id?:string;
  id: string;
  title: string;
  description: string;
  discountPercent: number;
  offerType: string;
  applicableHotelIds: string[];
  applicableHotelTypes: HotelType[];
  applicableRoomTypes: string[];
  validFrom: string;
  validTo: string;
  couponCode: string;
  minNights: number;
  isActive: boolean;
  badgeLabel: string;
  image: string;
}

 
// ── unified card type used in recommendation UI ──────────────────────────────
export type CardKind = 'hotel' | 'offer';

export interface RecommendationItem {
  kind: CardKind;
  hotel?: Hotel;
  offer?: Offer;
}
