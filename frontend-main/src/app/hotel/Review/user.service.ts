import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review, Reviewwithname } from './review.model';
import { env } from '../../../../.environment';

export interface ReviewsResponse {
  reviews: Reviewwithname[];
  avgRating: number;
  total: number;
}

export interface ReviewPrompt {
  _id: string;
  userId: string;
  hotelId: string;
  hotelName: string;
  hotelType: string;
  bookingReference: string;
  status: 'pending' | 'dismissed' | 'reviewed';
  nudgeCount: number;
  maxNudges: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private baseUrl = env.baseUrl;

  // ─── GET reviews + avgRating for a hotel ─────────────────────────────────
  // backend calculates avg from ALL reviews, returns top 7 with user names
  getReviewsWithName(entityId: string): Observable<ReviewsResponse> {
    return this.http.get<ReviewsResponse>(
      `${this.baseUrl}/reviews?entityId=${entityId}`,
    );
  }

  // ─── Check if user already reviewed this hotel ───────────────────────────
  getReviewByUserAndEntity(
    userId: string,
    entityId: string,
  ): Observable<Review[]> {
    return this.http.get<Review[]>(
      `${this.baseUrl}/reviews/user?userId=${userId}&entityId=${entityId}`,
    );
  }

  // ─── Check if user has a confirmed/completed booking ────────────────────
  checkvalidation(userId: string, hotelId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/reviews/validate?userId=${userId}&hotelId=${hotelId}`,
    );
  }

  // ─── Submit new review ───────────────────────────────────────────────────
  addreview(review: Review): Observable<any> {
    return this.http.post(`${this.baseUrl}/reviews`, review);
  }

  // ─── Update existing review ──────────────────────────────────────────────
  updatereview(review: Review): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/reviews/user/${review.userId}/entity/${review.entityId}`,
      review,
    );
  }

  // ─── Get hotel details by ID ──────────────────────────────────────────────
  getHotelById(hotelId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/reviews/hotel/${hotelId}`);
  }

  // ─── Review Prompts ───────────────────────────────────────────────────────
  getPendingPrompts(userId: string): Observable<ReviewPrompt[]> {
    return this.http.get<ReviewPrompt[]>(`${this.baseUrl}/prompts/${userId}`);
  }

  dismissPrompt(promptId: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/prompts/${promptId}/dismiss`, {});
  }

  markPromptReviewed(promptId: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/prompts/${promptId}/reviewed`, {});
  }
}
