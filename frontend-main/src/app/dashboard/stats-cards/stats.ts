import { DashboardStats } from "../dashboard.model";

export const statCardsData: {
  icon: string;
  label: string;
  key: keyof DashboardStats;
}[] = [
  {
    icon: 'bi-people-fill',
    label: 'Total Users',
    key: 'totalUsers',
  },
  {
    icon: 'bi-building',
    label: 'Hotel Bookings',
    key: 'hotelBookings',
  },
  {
    icon: 'bi-luggage',
    label: 'Travel Bookings',
    key: 'flightBookings',
  },
  {
    icon: 'bi-currency-rupee',
    label: 'Total Revenue',
    key: 'revenue',
  },
];
