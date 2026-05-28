import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TravelService, TravelBooking } from './travel.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TravelLocation } from './travel.model';
import { env } from '../../../.environment';

@Injectable({ providedIn: 'root' })
export class TravelDAO {
  private http = inject(HttpClient);
  private readonly API_URL = env.baseUrl;

  getServices(
    type: string,
    from: string,
    to: string,
    cabinClass?: string,
    date?: string,
  ): Observable<TravelService[]> {
    let url = `${this.API_URL}/travel/travelServices?type=${type.toLowerCase()}&isActive=true&from=${from}&to=${to}`;

    if (cabinClass) {
      url += `&cabinClass=${cabinClass}`;
    }
    if (date) {
      url += `&date=${date}`;
    }

    return this.http.get<TravelService[]>(url);
  }

  checkPnrUnique(pnr: string): Observable<TravelBooking[]> {
    return this.http.get<TravelBooking[]>(
      `${this.API_URL}/travel/travelBookings?bookingReference=${pnr}`,
    );
  }

  saveBooking(booking: TravelBooking): Observable<TravelBooking> {
    return this.http.post<TravelBooking>(
      `${this.API_URL}/travel/travelBookings`,
      booking,
    );
  }

  searchLocations(type: string, query: string): Observable<TravelLocation[]> {
    return this.http.get<TravelLocation[]>(
      `${this.API_URL}/travel/locations?type=${type}&q=${query}`,
    );
  }

  getBoardingPoints(serviceId: string, type: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.API_URL}/travel/boardingPoints?serviceId=${serviceId}&type=${type}`,
    );
  }

  getBookedSeats(serviceId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.API_URL}/travel/bookedSeats?serviceId=${serviceId}`,
    );
  }

  saveBookedSeat(seat: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/travel/bookedSeats`, seat);
  }

  updateAvailableSeats(serviceId: string, newCount: number): Observable<any> {
    return this.http.patch(
      `${this.API_URL}/travel/travelServices/${serviceId}`,
      {
        availableSeats: newCount,
      },
    );
  }

  getWallet(userId: string): Observable<any[]> {
    return this.http
      .get<any>(`${this.API_URL}/wallets/${userId}`)
      .pipe(map((wallet: any) => (wallet ? [wallet] : [])));
  }

  updateWalletBalance(walletId: string, newBalance: number) {
    return this.http.patch(`${this.API_URL}/wallets/${walletId}`, {
      balance: newBalance,
    });
  }

  updateWalletTransactions(
    walletId: string,
    transactions: any[],
  ): Observable<any> {
    return this.http.patch(`${this.API_URL}/wallets/${walletId}`, {
      transactions,
    });
  }

  getMyTravelBookings(userId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.API_URL}/bookings/travel/user/${userId}`,
    );
  }

  cancelTravelBooking(
    bookingId: string,
    refundPercent: number = 100,
  ): Observable<any> {
    return this.http.patch(
      `${this.API_URL}/travel/travelBookings/${bookingId}/cancel`,
      { refundPercent },
    );
  }
}
