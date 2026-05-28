import { RoomType, BedType, RoomStatus, PlanName } from './enums';

// ── HOTEL ────────────────────────────────────────────────────

export interface Hotel {
  _id: string;
  name: string;
  hotelType: string;
  userRating: number;
  starRating: number;
  description?: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    coordinates?: [number, number]; // [lat, lng]
  };
  contactPhone?: string;
  contactEmail?: string;
  checkInTime: string; // "14:00"
  checkOutTime: string; // "11:00"
  amenities: string[];
  images: string[];
  seasonalMultiplier: number;
  taxPercent: number;
  marketRate: number;
  isActive: boolean;
}

export interface RoomDetails {
  _id: string;
  hotelId: string;
  roomNumber: string;
  type: RoomType;
  bedType: BedType;
  maxOccupancy: number;
  basePricePerNight: number;
  floorNumber: number;
  status: RoomStatus;
  amenities: string[];
  images: string[];
  bedTypes: string[];
}

export interface RatePlan {
  _id: string;
  hotelId: string;
  planName: PlanName;
  includesBreakfast: boolean;
  includesLunch: boolean;
  includesDinner: boolean;
  isRefundable: boolean;
  freeCancellationHours: number;
  description?: string;
}
