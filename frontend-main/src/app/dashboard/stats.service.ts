import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStats, AdminUser } from './dashboard.model';
import { AdminBookingSummary } from '../booking/booking.model';
import { env } from '../../../.environment';

interface TopHotel {
  name: string;
  starRating: number;
  bookingCount: number;
  revenue: number;
}

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private http = inject(HttpClient);
  private adminUrl = env.baseUrl + '/admin';

  getRecentBookings(): Observable<AdminBookingSummary[]> {
    return this.http.get<AdminBookingSummary[]>(
      `${this.adminUrl}/recent-bookings`,
    );
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.adminUrl}/users`);
  }

  getTopHotels(): Observable<TopHotel[]> {
    return this.http.get<TopHotel[]>(`${this.adminUrl}/top-hotels`);
  }

  getDashBoardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.adminUrl}/stats`);
  }
}
