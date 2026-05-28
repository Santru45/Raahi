import { DashboardStats } from "../dashboard.model";

export type HighlightCardType = 'number' | 'currency' | 'hotel';

export const highlightCardsData: {
  icon: string;
  label: string;
  key?: keyof DashboardStats; // Optional because topHotelName is not inside dashboardStats
  color: string;
  type: HighlightCardType;
}[] = [
  {
    icon: 'bi-ticket-perforated-fill',
    label: 'Total Bookings',
    key: 'totalBookings',
    color: 'var(--bright-teal-blue)',
    type: 'number',
  },
  {
    icon: 'bi-building-fill',
    label: 'Hotel Revenue',
    key: 'hotelRevenue',
    color: 'var(--french-blue)',
    type: 'currency',
  },
  {
    icon: 'bi-airplane-fill',
    label: 'Flight Revenue',
    key: 'flightRevenue',
    color: 'var(--turquoise-surf)',
    type: 'currency',
  },
  {
    icon: 'bi-building-fill-check',
    label: 'Most Booked Hotel',
    //key for hotel not added because we are taking it directly from the topHotels[0]
    color: 'var(--blue-green)',
    type: 'hotel',
  },
];
