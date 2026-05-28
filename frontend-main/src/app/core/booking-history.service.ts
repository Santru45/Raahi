import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerBookingSummary } from '../booking/booking.model';
import { env } from '../../../.environment';

@Injectable({
  providedIn: 'root',
})
export class BookingHistoryService {
  private http = inject(HttpClient);
  private baseUrl = env.baseUrl;

  getBookingHistory(userId: string): Observable<CustomerBookingSummary[]> {
    return this.http.get<CustomerBookingSummary[]>(
      `${this.baseUrl}/bookings/user/${userId}`,
    );
  }
}
