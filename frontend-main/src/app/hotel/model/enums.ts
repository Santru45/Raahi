export enum RoomType {
  Standard  = 'standard',
  Deluxe    = 'deluxe',
  Suite     = 'suite',
  Executive = 'executive',
}

export enum BedType {
  Single = 'single',
  Double = 'double',
  Queen  = 'queen',
  King   = 'king',
}

export enum RoomStatus {
  Available    = 'available',
  Occupied     = 'occupied',
  Maintenance  = 'maintenance',
  Blocked      = 'blocked',
}

export enum PlanName {
  EP  = 'EP',   // Room only
  CP  = 'CP',   // Breakfast included
  MAP = 'MAP',  // Breakfast + Dinner
  AP  = 'AP',   // All meals
}

export enum BookingStatus {
  Pending    = 'pending',
  Confirmed  = 'confirmed',
  CheckedIn  = 'checked_in',
  CheckedOut = 'checked_out',
  Cancelled  = 'cancelled',
  NoShow     = 'no_show',
}

export enum PaymentStatus {
  Unpaid        = 'unpaid',
  PartiallyPaid = 'partially_paid',
  Paid          = 'paid',
  Refunded      = 'refunded',
}

export enum PaymentMethod {
  Wallet     = 'wallet',
  UPI        = 'upi',
  CreditCard = 'credit_card',
  DebitCard  = 'debit_card',
  NetBanking = 'netbanking',
  Cash       = 'cash',
}

export enum BookingSource {
  Website = 'website',
  App     = 'app',
  WalkIn  = 'walkin',
  Phone   = 'phone',
}

interface SubRatings {
  cleanliness: number;
  service: number;
  location: number;
  valueForMoney: number;
}


export interface Review {
  _id: string;
  userId: string;
  entityId: string;
  entityType: 'Hotel' | 'Restaurant' | 'Destination'; 
  rating: number;
  comment: string;
  year: number;
  subRatings: SubRatings;
  isVerified: boolean;
  createdAt: string; 
}