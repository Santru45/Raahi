import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { env } from '../../../../.environment';

export interface LedgerEntry {
  id: string;
  bookingReference: string;
  bookingType: string;
  action: 'earned' | 'redeemed' | 'clawback' | 'refunded';
  coins: number;
  balanceAfter: number;
  expiresAt?: string;
  note: string;
}

export interface LoyaltyAccount {
  _id: string;
  userId: string;
  coinBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  tier: string;
  earnMultiplier: number;
  maxRedeemPercent: number;
  nextTierAt: number;
  ledger: LedgerEntry[];
}

export interface RedeemValidation {
  valid: boolean;
  error?: string;
  maxAllowed: number;
  discountAmount: number;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  http = inject(HttpClient);
  baseurl = env.baseUrl;

  /** Reactive coin balance — navbar and other components can read this signal */
  coinBalance = signal<number | null>(null);

  /** Reactive full loyalty account — booking-summary components read this instead of making their own API call */
  loyaltyAccount = signal<LoyaltyAccount | null>(null);

  private syncAccount(acc: LoyaltyAccount | null): void {
    if (acc) {
      this.loyaltyAccount.set(acc);
      this.coinBalance.set(acc.coinBalance ?? 0);
    }
  }

  /** Call after login or whenever you need to sync the navbar coin count */
  refreshCoinBalance(userId: string): void {
    this.http
      .get<LoyaltyAccount>(`${this.baseurl}/loyalty/${userId}`)
      .subscribe({
        next: (acc) => this.syncAccount(acc),
        error: () => this.coinBalance.set(0),
      });
  }

  getByUserId(userId: string): Observable<LoyaltyAccount> {
    return this.http.get<LoyaltyAccount>(`${this.baseurl}/loyalty/${userId}`);
  }

  awardCoins(
    userId: string,
    bookingAmount: number,
    bookingReference: string,
    bookingType: 'hotel' | 'travel',
  ): Observable<LoyaltyAccount> {
    return this.http
      .post<LoyaltyAccount>(`${this.baseurl}/loyalty/${userId}/award`, {
        bookingAmount,
        bookingReference,
        bookingType,
      })
      .pipe(tap((acc) => this.syncAccount(acc)));
  }

  validateRedeem(
    userId: string,
    coinsToRedeem: number,
    bookingAmount: number,
  ): Observable<RedeemValidation> {
    return this.http.post<RedeemValidation>(
      `${this.baseurl}/loyalty/${userId}/validate-redeem`,
      { coinsToRedeem, bookingAmount },
    );
  }

  redeemCoins(
    userId: string,
    coinsToRedeem: number,
    bookingReference: string,
    bookingAmount: number,
    bookingType: 'hotel' | 'travel' = 'hotel',
  ): Observable<{ account: LoyaltyAccount; discountAmount: number }> {
    return this.http
      .post<{
        account: LoyaltyAccount;
        discountAmount: number;
      }>(`${this.baseurl}/loyalty/${userId}/redeem`, {
        coinsToRedeem,
        bookingReference,
        bookingAmount,
        bookingType,
      })
      .pipe(tap((res) => this.syncAccount(res?.account ?? null)));
  }

  handleBookingCancellation(
    userId: string,
    booking: {
      bookingReference: string;
      coinsEarned: number;
      coinsRedeemed: number;
    },
  ): Observable<LoyaltyAccount> {
    return this.http
      .post<LoyaltyAccount>(`${this.baseurl}/loyalty/${userId}/cancel`, booking)
      .pipe(tap((acc) => this.syncAccount(acc)));
  }

  coinsToDiscount(coins: number): number {
    return coins * 0.5;
  }

  calculateCoins(amount: number, multiplier: number): number {
    return Math.floor((amount / 100) * multiplier);
  }
}
