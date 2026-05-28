export interface HotelSummary {
  name: string;
  starRating: number;
  bookingCount: number;
  revenue: number;
}

export interface Hotel {
  _id: string;
  name: string;
  starRating: number;
  location: {
    city: string;
  };
}
