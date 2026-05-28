import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Hotel } from './model/hotel.model';
import { Review } from './model/enums';
import { env } from '../../../.environment';
import { switchMap } from 'rxjs/operators';
import { RoomDetails } from './model/hotel.model';
import { RatePlan } from './model/hotel.model';

@Injectable({
  providedIn: 'root',
})
export class HotelDao {
  baseUrl = env.baseUrl + '/hotels';
  httpClient = inject(HttpClient);

  getAllHotels(params?: {
    city?: string;
    starRating?: number | null;
    amenities?: string[];
    hotelType?: string;
    name?: string;
    search?: string;
  }): Observable<Hotel[]> {
    let query = '';
    if (params) {
      const parts: string[] = [];
      if (params.search)
        parts.push(`search=${encodeURIComponent(params.search)}`);
      else {
        if (params.city) parts.push(`city=${encodeURIComponent(params.city)}`);
        if (params.name) parts.push(`name=${encodeURIComponent(params.name)}`);
      }
      if (params.starRating) parts.push(`starRating=${params.starRating}`);
      if (params.amenities && params.amenities.length > 0)
        parts.push(
          `amenities=${params.amenities.map(encodeURIComponent).join(',')}`,
        );
      if (params.hotelType)
        parts.push(`hotelType=${encodeURIComponent(params.hotelType)}`);
      if (parts.length) query = '?' + parts.join('&');
    }
    return this.httpClient.get<Hotel[]>(`${this.baseUrl}${query}`);
  }

  getMeta(): Observable<{
    cities: string[];
    amenities: string[];
    hotelTypes: string[];
  }> {
    return this.httpClient.get<{
      cities: string[];
      amenities: string[];
      hotelTypes: string[];
    }>(`${this.baseUrl.replace('/hotels', '/hotel-catalog')}/meta`);
  }

  getHotelById(id: string): Observable<Hotel> {
    return this.httpClient.get<Hotel>(`${this.baseUrl}/${id}`);
  }

  getTotalReview(hotelId: string): Observable<Review[]> {
    return this.httpClient
      .get<{
        reviews: Review[];
        avgRating: number;
        total: number;
      }>(env.baseUrl + `/reviews?entityId=${hotelId}`)
      .pipe(map((response) => response.reviews || []));
  }

  createBooking(booking: any): Observable<any> {
    return this.httpClient.post(`${env.baseUrl}/hotel-bookings`, booking);
  }

  getHotelByIdForUpdate(hotelId: string): Observable<any[]> {
    return this.httpClient
      .get<any>(`${env.baseUrl}/hotels/${hotelId}`)
      .pipe(map((h) => [h]));
  }

  getMyBookings(userId: string): Observable<any[]> {
    return this.httpClient.get<any[]>(
      `${env.baseUrl}/hotel-bookings?userId=${userId}`,
    );
  }

  cancelBooking(bookingId: string): Observable<any> {
    return this.httpClient.patch(
      `${env.baseUrl}/hotel-bookings/${bookingId}/cancel`,
      {},
    );
  }

  getRoomsByHotelId(hotelId: string): Observable<RoomDetails[]> {
    return this.httpClient.get<RoomDetails[]>(
      `${env.baseUrl}/rooms?hotelId=${hotelId}`,
    );
  }

  getAvailableRoomsByHotelId(
    hotelId: string,
    checkIn: string,
    checkOut: string,
  ): Observable<RoomDetails[]> {
    return this.httpClient.get<RoomDetails[]>(
      `${env.baseUrl}/rooms/available?hotelId=${hotelId}&checkIn=${checkIn}&checkOut=${checkOut}`,
    );
  }

  getRatePlansByHotelId(hotelId: string): Observable<RatePlan[]> {
    return this.httpClient.get<RatePlan[]>(
      `${env.baseUrl}/rate-plans?hotelId=${hotelId}`,
    );
  }

  validateCoupon(
    couponCode: string,
    hotelId: string,
    roomType: string,
    nights: number,
  ): Observable<any> {
    return this.httpClient.post(
      `${env.baseUrl}/hotel-catalog/validate-coupon`,
      { couponCode, hotelId, roomType, nights },
    );
  }

  updateRoomStatus(roomId: string, status: string): Observable<any> {
    return this.httpClient.patch(`${env.baseUrl}/rooms/${roomId}`, { status });
  }

  setRoomAvailable(roomId: string): Observable<any> {
    return this.httpClient.patch(`${env.baseUrl}/rooms/${roomId}`, {
      status: 'available',
    });
  }

  getAllRooms(): Observable<RoomDetails[]> {
    return this.httpClient.get<RoomDetails[]>(`${env.baseUrl}/rooms`);
  }

  getWalletByUserId(userId: string): Observable<any> {
    return this.httpClient.get<any>(`${env.baseUrl}/wallets/${userId}`);
  }

  updateWalletBalance(
    walletId: string,
    newBalance: number,
    transactions: any[],
  ): Observable<any> {
    return this.httpClient
      .patch(`${env.baseUrl}/wallets/${walletId}`, {
        balance: newBalance,
        transactions,
      })
      .pipe(
        map((response) => ({
          ...response,
          balance: newBalance, // Ensure balance is in the response
        })),
      );
  }

  getLoyaltyByUserId(userId: string): Observable<any[]> {
    return this.httpClient
      .get<any>(`${env.baseUrl}/loyalty/${userId}`)
      .pipe(map((acc) => (acc ? [acc] : [])));
  }
}
