export interface Itinerary {
  _id: string;
  id? : string;
  user_id: string | null;
  trip_name: string;
  destination?: string | null;
  start_date: string | null;
  end_date: string | null;
  type: 'std' | 'custom';
  images: string[];
  created_at?: string;
}

export interface ItineraryItem {
  item_id: string;
  _id: string;
  category: 'travel' | 'hotel' | 'activity';
  start_datetime: Date | string;
  end_datetime: Date | string;
  location: string;
  reference_id: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
}
