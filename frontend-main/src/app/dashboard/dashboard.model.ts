import { User } from './../core/user.model';
import { AdminBookingSummary } from '../booking/booking.model';

export interface DashboardStats {
  totalUsers: number;
  hotelBookings: number;
  flightBookings: number;
  revenue: number;
  totalCustomers: number;
  totalAdmins: number;
  activeUsers: number;
  totalBookings: number;
  hotelRevenue: number;
  flightRevenue: number;
  trainRevenue: number;
  cancellationRate: number;
  avgBookingsPerCustomer: number;
}

export interface AdminUser extends User {
  bookingCount: number;
  totalSpent: number;
}
