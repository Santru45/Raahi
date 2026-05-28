// booking-summary.component.ts

import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs'; // ← replaces deprecated .toPromise()
import { TransportService } from '../../travel.service';
import { AuthService } from '../../../auth/auth.service';
import {
  LoyaltyService,
  RedeemValidation,
} from '../../../profile/loyalty/loyalty-service';

declare var Razorpay: any;

type PaymentState = 'idle' | 'processing' | 'confirmed';

@Component({
  selector: 'app-booking-summary',
  standalone: true,
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './booking-summary.component.html',
  styleUrl: './booking-summary.component.scss',
})
export class BookingSummaryComponent implements OnInit {
  transportService = inject(TransportService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private loyaltyService = inject(LoyaltyService);

  // ─── Auth State ────────────────────────────────────────
  isLoggedIn = false;
  userId = '';

  // ─── Loading & Error ───────────────────────────────────
  isLoadingWallet = true;
  bookingError = '';

  // ─── Payment Popup ─────────────────────────────────────
  paymentState = signal<PaymentState>('idle');

  // ─── Payment Method ────────────────────────────────────
  selectedPayment = 'wallet';
  paymentMessage = '';

  paymentMethods = [
    {
      key: 'wallet',
      name: 'Virtual Wallet',
      icon: 'bi-wallet2',
      enabled: true,
    },
    {
      key: 'razorpay',
      name: 'Razorpay',
      icon: 'bi-credit-card-2-front',
      enabled: true,
      subtitle: 'Cards, NetBanking, Wallet & Pay Later',
    },
    { key: 'upi', name: 'UPI', icon: 'bi-phone', enabled: false },
    {
      key: 'card',
      name: 'Credit / Debit Card',
      icon: 'bi-credit-card',
      enabled: false,
    },
    { key: 'netbanking', name: 'Net Banking', icon: 'bi-bank', enabled: false },
  ];

  // ─── Loyalty State ─────────────────────────────────────
  get loyaltyAccount() {
    return this.loyaltyService.loyaltyAccount();
  }
  get isLoadingLoyalty() {
    return this.loyaltyService.loyaltyAccount() === null;
  }

  get effectiveMaxCoins(): number {
    const account = this.loyaltyAccount;
    if (!account || account.coinBalance < 0) return 0;
    return Math.min(account.coinBalance, this.maxRedeemableCoins);
  }

  coinsToRedeem = 0;
  redeemValidation: RedeemValidation | null = null;
  loyaltyError = '';
  maxRedeemableCoins = 0;

  // ─── Pricing ───────────────────────────────────────────
  // Exposed as a getter so the template can reference `pricing` once
  // without @let (which requires Angular 18.1+).
  // Not a computed() signal because it depends on plain booleans
  // (useLoyaltyCoins) that don't participate in the signal graph.
  get pricing() {
    const trip = this.transportService.selectedTrip();
    const passengers = this.transportService.passengerData();
    if (!trip || passengers.length === 0) return null;

    const baseAmount = trip.fare * passengers.length;
    const taxAmount =
      Math.round(((baseAmount * trip.taxPercent) / 100) * 100) / 100; // ← avoid float drift
    const subtotal = baseAmount + taxAmount;

    const loyaltyDiscount = this.redeemValidation?.valid
      ? this.redeemValidation.discountAmount
      : 0;

    const coinsUsed = this.redeemValidation?.valid ? this.coinsToRedeem : 0;

    const totalAmount = Math.round((subtotal - loyaltyDiscount) * 100) / 100; // ← avoid float drift
    const savings = (trip.marketRate - trip.fare) * passengers.length;

    return {
      baseAmount,
      taxAmount,
      subtotal,
      loyaltyDiscount,
      coinsUsed,
      totalAmount,
      savings,
      marketRate: trip.marketRate * passengers.length,
    };
  }

  // ─── Getters ───────────────────────────────────────────
  get walletBalance(): number {
    return this.transportService.walletBalance();
  }

  get insufficientBalance(): boolean {
    const pricing = this.pricing;
    if (!pricing) return false;
    return this.walletBalance < pricing.totalAmount;
  }

  get coinBalance(): number {
    return this.loyaltyAccount?.coinBalance ?? 0;
  }

  get maxRedeemPercent(): number {
    return this.loyaltyAccount?.maxRedeemPercent ?? 0;
  }

  get loyaltyDiscountDisplay(): number {
    if (!this.redeemValidation?.valid) return 0;
    return this.redeemValidation.discountAmount;
  }

  get coinsEarnedFromBooking(): number {
    if (!this.loyaltyAccount) return 0;
    const pricing = this.pricing;
    if (!pricing) return 0;
    return this.loyaltyService.calculateCoins(
      pricing.totalAmount,
      this.loyaltyAccount.earnMultiplier,
    );
  }

  // ─── Lifecycle ─────────────────────────────────────────
  ngOnInit(): void {
    this.loadRazorpayScript();

    // Try to restore booking state from sessionStorage if page was reloaded
    this.transportService.restoreBookingStateFromStorage();

    const user = this.authService.getCurrentUser();

    if (!user) {
      this.isLoggedIn = false;
      this.isLoadingWallet = false;
      return;
    }

    this.isLoggedIn = true;
    this.userId = user._id;

    this.transportService
      .loadWallet(this.userId)
      .then(() => (this.isLoadingWallet = false))
      .catch(() => {
        this.isLoadingWallet = false;
        this.bookingError = 'Unable to fetch wallet balance.';
      });

    // Load max redeemable coins from backend
    setTimeout(() => {
      if (this.loyaltyAccount) {
        this.validateCoins();
      }
    }, 100);
  }

  // ─── Auth Redirects ────────────────────────────────────
  goToLogin(): void {
    // State in TransportService (signals, providedIn: 'root') survives
    // navigation automatically — no serialization needed.
    localStorage.setItem('returnUrl', this.router.url); // capture exact current URL
    this.router.navigate(['/login']);
  }

  goToSignup(): void {
    localStorage.setItem('returnUrl', this.router.url);
    this.router.navigate(['/signup']);
  }

  // ─── Loyalty Methods ───────────────────────────────────
  onCoinsInput(event: any): void {
    const input = event.target;
    let value = parseInt(input.value) || 0;
    if (value > this.maxRedeemableCoins) {
      value = this.maxRedeemableCoins;
      input.value = value;
      this.coinsToRedeem = value;
    }
  }

  onCoinsChange(): void {
    if (this.coinsToRedeem < 0) this.coinsToRedeem = 0;
    if (this.coinsToRedeem > this.maxRedeemableCoins)
      this.coinsToRedeem = this.maxRedeemableCoins;
    this.coinsToRedeem = Math.floor(this.coinsToRedeem);
    this.validateCoins();
  }

  useMaxCoins(): void {
    this.coinsToRedeem = this.effectiveMaxCoins;
    this.validateCoins();
  }

  removeCoins(): void {
    this.coinsToRedeem = 0;
    this.redeemValidation = null;
    this.loyaltyError = '';
  }

  private validateCoins(): void {
    if (!this.loyaltyAccount) {
      this.loyaltyError = '';
      this.redeemValidation = null;
      this.maxRedeemableCoins = 0;
      return;
    }
    const pricing = this.pricing;
    if (!pricing) return;

    // Don't validate if coinsToRedeem is 0
    if (this.coinsToRedeem === 0) {
      this.loyaltyError = '';
      this.redeemValidation = null;
      // Still get max allowed for the booking amount
      this.loyaltyService
        .validateRedeem(this.userId, 1, pricing.subtotal)
        .subscribe({
          next: (result) => {
            this.maxRedeemableCoins = result.maxAllowed;
          },
          error: () => {
            this.maxRedeemableCoins = 0;
          },
        });
      return;
    }

    this.loyaltyService
      .validateRedeem(this.userId, this.coinsToRedeem, pricing.subtotal)
      .subscribe({
        next: (result) => {
          this.maxRedeemableCoins = result.maxAllowed;
          this.redeemValidation = result;
          this.loyaltyError = result.valid ? '' : result.error || '';
          if (!result.valid && result.maxAllowed < this.coinsToRedeem) {
            this.coinsToRedeem = result.maxAllowed;
          }
        },
        error: () => {
          this.loyaltyError = 'Unable to validate coins. Please try again.';
          this.redeemValidation = null;
          this.maxRedeemableCoins = 0;
        },
      });
  }

  // ─── Payment Method ────────────────────────────────────
  selectPayment(method: string): void {
    const selected = this.paymentMethods.find((m) => m.key === method);
    if (selected?.enabled) {
      this.selectedPayment = method;
      this.paymentMessage = '';
    } else {
      this.paymentMessage = `${selected?.name} will be available soon. Please use Virtual Wallet for now.`;
      setTimeout(() => (this.paymentMessage = ''), 3000);
    }
  }

  // ─── Razorpay Methods ──────────────────────────────────
  loadRazorpayScript(): void {
    if (typeof Razorpay !== 'undefined') return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }

  openRazorpayCheckout(): void {
    const pricing = this.pricing;
    const trip = this.transportService.selectedTrip();
    const passengers = this.transportService.passengerData();

    if (!pricing || !trip || passengers.length === 0) return;

    // Check if Razorpay is loaded
    if (typeof Razorpay === 'undefined') {
      this.bookingError =
        'Razorpay is not loaded. Please refresh the page and try again.';
      return;
    }

    const options = {
      key: 'rzp_test_SozdiTBvohiEK8', // Replace with your Razorpay Key ID
      amount: pricing.totalAmount * 100, // Amount in paise
      currency: 'INR',
      name: 'Raahi Travel',
      description: `${trip.type.toUpperCase()} - ${trip.from} to ${trip.to}`,
      image: '/favicon.ico',
      handler: (response: any) => {
        this.handleRazorpaySuccess(response);
      },
      prefill: {
        name: passengers[0]?.firstName + ' ' + passengers[0]?.lastName || '',
        email: this.authService.getCurrentUser()?.email || '',
        contact: '',
      },
      notes: {
        bookingType: 'travel',
        mode: trip.type,
        serviceId: trip._id,
      },
      theme: {
        color: '#0891b2',
      },
      modal: {
        ondismiss: () => {
          this.paymentState.set('idle');
        },
      },
    };

    const razorpay = new Razorpay(options);
    razorpay.open();
  }

  handleRazorpaySuccess(razorpayResponse: any): void {
    console.log('Razorpay payment successful:', razorpayResponse);
    this.processBooking('razorpay');
  }

  // ─── Confirm Booking ───────────────────────────────────
  async onConfirmBooking(): Promise<void> {
    console.log('booking Summary :Confirm Booking ');
    if (!this.isLoggedIn) {
      this.goToLogin();
      return;
    }

    // Check payment method
    if (this.selectedPayment === 'razorpay') {
      this.openRazorpayCheckout();
      return;
    }

    // Wallet payment - process directly
    await this.processBooking('wallet');
  }

  // ─── Process Booking (shared for both Wallet and Razorpay) ───
  private async processBooking(
    paymentMethod: 'wallet' | 'razorpay' = 'wallet',
  ): Promise<void> {
    const trip = this.transportService.selectedTrip();
    const passengers = this.transportService.passengerData();
    const pricing = this.pricing;

    if (!trip || passengers.length === 0 || !pricing) {
      this.bookingError = 'Missing booking details.';
      return;
    }

    if (paymentMethod === 'wallet' && this.insufficientBalance) {
      this.bookingError = 'Insufficient wallet balance.';
      return;
    }

    this.paymentState.set('processing');
    this.bookingError = '';

    try {
      const { coinsUsed, loyaltyDiscount, totalAmount } = pricing;

      await this.delay(2500);

      // 1. Save booking
      const booking = await this.transportService.processBooking(
        trip,
        passengers,
        this.userId,
        loyaltyDiscount,
        coinsUsed,
        paymentMethod,
        this.loyaltyAccount?.earnMultiplier ?? 1,
      );
      await this.delay(500);

      // 2. Deduct from wallet only for wallet payments
      if (paymentMethod === 'wallet') {
        await this.transportService.deductFromWallet(
          totalAmount,
          `${trip.type} booking: ${trip.from} to ${trip.to}`,
        );
        await this.delay(500);
      }

      // 3. Redeem loyalty coins (if used)
      if (coinsUsed > 0 && this.loyaltyAccount) {
        await firstValueFrom(
          this.loyaltyService.redeemCoins(
            this.userId,
            coinsUsed,
            booking.bookingReference,
            pricing.subtotal, // Use subtotal (before discount) for backend validation
            'travel',
          ),
        );
        await this.delay(500);
      }

      // 4. Award new loyalty coins
      if (this.loyaltyAccount) {
        await firstValueFrom(
          this.loyaltyService.awardCoins(
            this.userId,
            totalAmount,
            booking.bookingReference,
            'travel',
          ),
        );
      }

      //5 Show confirmed popup
      this.paymentState.set('confirmed');
      await this.delay(2500);

      this.transportService.clearBookingState();
      window.scrollTo({ top: 0, behavior: 'instant' });
      this.router.navigate(['/travel/success']);
    } catch (err) {
      console.error('Booking failed:', err);
      this.paymentState.set('idle');
      this.bookingError = 'Booking failed. Please try again.';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
