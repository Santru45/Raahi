export interface AdminBookingSummary {
  bookingReference: string;
  userId : string;
  type: 'hotel' | 'flight' | 'train' | 'bus';
  destination: string;
  amount: number;
  bookingStatus: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  bookedAt: string;
  userName: string;
}

export interface CustomerBookingSummary {
  bookingReference: string;
  type: 'hotel' | 'flight' | 'train' | 'bus';
  destination: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  bookedAt:string
}

export interface HotelBooking {
  _id: string;
  userId: string;
  hotelId: string;
  bookingReference: string;
  bookingStatus: 'confirmed' | 'pending' | 'cancelled';
  bookedAt: string;
  pricing: {
    totalAmount: number;
  };
  checkIn: string;
  checkOut: string;
}

export interface TravelBooking {
  _id: string;
  userId: string;
  serviceId: string;
  bookingReference: string;
  bookingStatus: 'confirmed' | 'pending' | 'cancelled';
  bookedAt: string;
  pricing: {
    totalAmount: number;
  };
  serviceSnapshot: {
    type: 'flight' | 'train' | 'bus';
    to: string;
  };
}

// export interface ItineraryBooking {
//   _id: string;
//   userId: string;
//   itineraryId: string;
//   bookingReference: string;
//   bookingStatus: 'confirmed' | 'pending' | 'cancelled';
//   bookedAt: string;
//   pricing: {
//     totalAmount: number;
//   };
//   itinerarySnapshot: {
//     trip_name: string;
//   };
// }
