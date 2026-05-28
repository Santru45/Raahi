import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { env } from '../../../../.environment';
import { Hotel, Offer, RecommendationItem, normalizeIds } from '../user.model';

@Injectable({ providedIn: 'root' })
export class RecommendService {
  private http = inject(HttpClient);
  private baseurl = env.baseUrl;

  // â”€â”€ Main recommendation call â€” all personalisation logic is in the backend â”€

  getRecommendation(
    userId?: string,
    location?: string,
  ): Observable<RecommendationItem[]> {
    const params: string[] = [];
    if (userId) params.push(`userId=${encodeURIComponent(userId)}`);
    if (location) params.push(`location=${encodeURIComponent(location)}`);
    const qs = params.length ? '?' + params.join('&') : '';
    return this.http.get<RecommendationItem[]>(
      `${this.baseurl}/recommendations${qs}`,
    );
  }

  // â”€â”€ Offer detail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  getOfferWithHotels(
    offerId: string,
  ): Observable<{ offer: Offer; hotels: Hotel[] }> {
    return this.http.get<{ offer: Offer; hotels: Hotel[] }>(
      `${this.baseurl}/recommendations/offer/${offerId}`,
    );
  }

  // â”€â”€ Hotel detail (used by offer-detail page) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  getHotelById(hotelId: string): Observable<Hotel[]> {
    return this.http
      .get<Hotel[]>(`${this.baseurl}/recommendations/hotel/${hotelId}`)
      .pipe(map((hotels) => normalizeIds(hotels)));
  }
}
