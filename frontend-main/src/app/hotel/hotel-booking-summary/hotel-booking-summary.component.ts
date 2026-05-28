import { Component, OnInit, inject, signal, NgZone } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HotelService, BookingRoom } from '../hotel.service';
import { LoyaltyService } from '../../profile/loyalty/loyalty-service';
import { AuthService } from '../../auth/auth.service';

declare var Razorpay: any;
type PaymentState = 'idle' | 'processing' | 'confirmed';

@Component({
  selector: 'app-hotel-booking-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hotel-booking-summary.component.html',
  styleUrl: './hotel-booking-summary.component.scss',
})
export class HotelBookingSummaryComponent implements OnInit {
  hotelId = '';
  hotelName = '';
  checkIn = '';
  checkOut = '';
  nights = 0;
  taxPercent = 0;
  marketRate = 0;
  rooms: BookingRoom[] = [];
  activeImageIndex = 0;

  private hotelService = inject(HotelService);
  private authService = inject(AuthService);
  private loyaltyService = inject(LoyaltyService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  get roomCount(): number {
    return this.rooms.length;
  }
  get roomType(): string {
    return this.rooms[0]?.roomType ?? '';
  }
  get bedType(): string {
    return this.rooms[0]?.bedType ?? '';
  }
  get pricePerNight(): number {
    return this.rooms[0]?.pricePerNight ?? 0;
  }
  get roomImages(): string[] {
    return this.rooms[0]?.images ?? [];
  }
  get roomAmenities(): string[] {
    return this.rooms[0]?.amenities ?? [];
  }
  get maxOccupancy(): number {
    return this.rooms[0]?.maxOccupancy ?? 1;
  }

  walletId = '';
  walletBalance = 0;
  walletTransactions: any[] = [];
  selectedPayment = 'wallet';

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
  loyaltyError = '';
  maxRedeemableCoins = 0;

  couponCode = '';
  couponInput = '';
  couponDiscountPercent = 0;
  couponOfferId = '';
  couponMinNights = 0;
  hasCoupon = false;
  couponError = '';
  isCouponLoading = false;

  guestTitle = 'Mr';
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  aadhaar = '';

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;
  termsAccepted = false;
  showTermsModal = false;

  get phoneDigits(): string {
    return this.phone.replace(/\s/g, '');
  }
  get aadhaarDigits(): string {
    return this.aadhaar.replace(/\s/g, '');
  }
  get phoneFormatted(): string {
    const d = this.phoneDigits.slice(0, 10);
    if (d.length <= 5) return d;
    return d.slice(0, 5) + ' ' + d.slice(5);
  }
  get aadhaarFormatted(): string {
    const d = this.aadhaarDigits.slice(0, 12);
    if (d.length <= 4) return d;
    if (d.length <= 8) return d.slice(0, 4) + ' ' + d.slice(4);
    return d.slice(0, 4) + ' ' + d.slice(4, 8) + ' ' + d.slice(8);
  }

  onNameInput(event: Event, field: 'firstName' | 'lastName'): void {
    const input = event.target as HTMLInputElement;
    // Strip anything that isn't a letter or space
    const cleaned = input.value.replace(/[^A-Za-z ]/g, '');
    const titled = cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
    this[field] = titled;
    input.value = titled;
  }

  get phoneError(): string {
    const d = this.phoneDigits;
    if (d.length === 0) return 'Mobile number is required';
    if (!/^[6-9]/.test(d))
      return 'Number must start with 6, 7, 8, or 9 — not ' + d[0];
    if (d.length < 10)
      return `Enter remaining ${10 - d.length} digit${10 - d.length > 1 ? 's' : ''}`;
    return '';
  }

  get aadhaarError(): string {
    const d = this.aadhaarDigits;
    if (d.length === 0) return 'Aadhaar number is required';
    if (d[0] === '0' || d[0] === '1')
      return 'Aadhaar cannot start with ' + d[0] + ' — must begin with 2–9';
    if (d.length < 12)
      return `Enter remaining ${12 - d.length} digit${12 - d.length > 1 ? 's' : ''}`;
    return '';
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 10);
    this.phone = digits;
    const formatted =
      digits.length <= 5 ? digits : digits.slice(0, 5) + ' ' + digits.slice(5);
    input.value = formatted;
  }
  onAadhaarInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 12);
    this.aadhaar = digits;
    let formatted = digits;
    if (digits.length > 4)
      formatted = digits.slice(0, 4) + ' ' + digits.slice(4);
    if (digits.length > 8)
      formatted =
        digits.slice(0, 4) + ' ' + digits.slice(4, 8) + ' ' + digits.slice(8);
    input.value = formatted;
  }

  get formValid(): boolean {
    const lastNameOk =
      this.lastName.trim() === '' || /^[A-Za-z ]+$/.test(this.lastName);
    const guestOk =
      this.firstName.trim().length >= 2 &&
      /^[A-Za-z ]+$/.test(this.firstName) &&
      lastNameOk &&
      /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(this.email) &&
      /^[6-9][0-9]{9}$/.test(this.phoneDigits) &&
      /^[2-9][0-9]{11}$/.test(this.aadhaarDigits) &&
      this.termsAccepted;
    if (!guestOk) return false;
    // Wallet: must have sufficient balance. Razorpay: always OK.
    if (this.selectedPayment === 'wallet')
      return this.walletBalance >= this.finalTotal;
    return true;
  }

  get baseAmount(): number {
    return this.pricePerNight * this.nights * this.roomCount;
  }

  get couponDiscount(): number {
    if (!this.hasCoupon || this.couponDiscountPercent <= 0) return 0;
    if (this.nights < this.couponMinNights) return 0;
    return parseFloat(
      ((this.baseAmount * this.couponDiscountPercent) / 100).toFixed(2),
    );
  }

  get amountAfterCoupon(): number {
    return this.baseAmount - this.couponDiscount;
  }

  get coinDiscount(): number {
    if (this.hasCoupon) return 0;
    return this.coinsToRedeem * 0.5;
  }

  get taxableAmount(): number {
    return this.amountAfterCoupon - this.coinDiscount;
  }

  get taxAmount(): number {
    return parseFloat(
      ((this.taxableAmount * this.taxPercent) / 100).toFixed(2),
    );
  }

  get finalTotal(): number {
    return parseFloat((this.taxableAmount + this.taxAmount).toFixed(2));
  }

  get youSave(): number {
    const savings =
      (this.marketRate > 0 ? this.marketRate - this.finalTotal : 0) +
      this.couponDiscount;
    return savings > 0 ? savings : 0;
  }

  get coinsEarned(): number {
    if (!this.loyaltyAccount) return 0;
    return this.loyaltyService.calculateCoins(
      this.finalTotal,
      this.loyaltyAccount.earnMultiplier,
    );
  }

  get totalGuests(): number {
    return this.maxOccupancy * this.roomCount;
  }

  isLoading = false;
  isBooked = false;
  isLoggedIn = false;
  bookingReference = '';
  bookedAtDate: Date = new Date();
  qrCodeUrl = '';
  userId = '';
  paymentState = signal<PaymentState>('idle');

  ngOnInit(): void {
    this.loadRazorpayScript();
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.isLoggedIn = false;
    } else {
      this.isLoggedIn = true;
      this.userId = user._id;
    }

    const state = this.hotelService.getBookingState();
    if (!state) {
      this.router.navigate(['/hotel']);
      return;
    }

    this.hotelId = state.hotelId;
    this.hotelName = state.hotelName;
    this.checkIn = state.checkIn;
    this.checkOut = state.checkOut;
    this.nights = state.nights;
    this.taxPercent = state.taxPercent;
    this.marketRate = state.marketRate;
    this.rooms = state.rooms;

    if (state.couponCode) {
      this.couponCode = state.couponCode;
      this.couponDiscountPercent = state.couponDiscountPercent;
      this.couponOfferId = state.couponOfferId;
      this.couponMinNights = state.couponMinNights;
      this.hasCoupon = true;

      if (this.nights < this.couponMinNights) {
        this.couponError = `Coupon requires minimum ${this.couponMinNights} night(s). You have ${this.nights}.`;
      }
    }

    if (state.guestTitle) this.guestTitle = state.guestTitle;
    if (state.firstName) this.firstName = state.firstName;
    if (state.lastName) this.lastName = state.lastName;
    if (state.email) this.email = state.email;
    if (state.phone) this.phone = state.phone;
    if (state.aadhaar) this.aadhaar = state.aadhaar;

    if (this.isLoggedIn) {
      this.hotelService.getWalletByUserId(this.userId).subscribe({
        next: (wallet) => {
          if (wallet) {
            this.walletId = wallet._id;
            this.walletBalance = wallet.balance;
            this.walletTransactions = wallet.transactions || [];
          }
        },
        error: (err) => console.error('Wallet fetch failed', err),
      });

      // Wait a bit for loyalty account to load, then validate coins
      setTimeout(() => {
        if (
          this.loyaltyAccount &&
          this.rooms.length > 0 &&
          this.baseAmount > 0
        ) {
          this.validateCoins();
        }
      }, 300);
    }
  }

  goToLogin(): void {
    this.saveGuestToState();
    localStorage.setItem('returnUrl', '/hotel/booking-summary');
    this.router.navigate(['/login']);
  }

  goToSignup(): void {
    this.saveGuestToState();
    localStorage.setItem('returnUrl', '/hotel/booking-summary');
    this.router.navigate(['/signup']);
  }

  private saveGuestToState(): void {
    const state = this.hotelService.getBookingState();
    if (state) {
      state.guestTitle = this.guestTitle;
      state.firstName = this.firstName;
      state.lastName = this.lastName;
      state.email = this.email;
      state.phone = this.phone;
      state.aadhaar = this.aadhaar;
      this.hotelService.setBookingState(state);
    }
  }

  nextImage(): void {
    this.activeImageIndex =
      (this.activeImageIndex + 1) % this.roomImages.length;
  }

  prevImage(): void {
    this.activeImageIndex =
      (this.activeImageIndex - 1 + this.roomImages.length) %
      this.roomImages.length;
  }

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
    if (this.hasCoupon) {
      this.coinsToRedeem = 0;
      return;
    }
    if (this.coinsToRedeem < 0) this.coinsToRedeem = 0;
    if (this.coinsToRedeem > this.maxRedeemableCoins)
      this.coinsToRedeem = this.maxRedeemableCoins;
    this.coinsToRedeem = Math.floor(this.coinsToRedeem);
    this.validateCoins();
  }

  applyMaxCoins(): void {
    if (this.hasCoupon) return;
    this.coinsToRedeem = this.maxRedeemableCoins;
    this.validateCoins();
  }

  removeCoins(): void {
    this.coinsToRedeem = 0;
    this.loyaltyError = '';
  }

  removeCoupon(): void {
    this.hasCoupon = false;
    this.couponCode = '';
    this.couponInput = '';
    this.couponDiscountPercent = 0;
    this.couponOfferId = '';
    this.couponMinNights = 0;
    this.couponError = '';
  }

  applyCoupon(): void {
    const code = this.couponInput.trim().toUpperCase();
    if (!code) {
      this.couponError = 'Please enter a coupon code.';
      return;
    }
    this.isCouponLoading = true;
    this.couponError = '';
    this.hotelService
      .validateCoupon(code, this.hotelId, this.roomType, this.nights)
      .subscribe({
        next: (res) => {
          this.isCouponLoading = false;
          if (res.valid) {
            this.couponCode = code;
            this.couponDiscountPercent = res.discountPercent;
            this.couponOfferId = res.offerId;
            this.couponMinNights = res.minNights;
            this.hasCoupon = true;
            this.couponError = '';
            this.coinsToRedeem = 0;
            this.toast(
              `🎉 Coupon applied! ${res.discountPercent}% off`,
              'success',
            );
          } else {
            this.couponError = res.message;
          }
        },
        error: () => {
          this.isCouponLoading = false;
          this.couponError = 'Could not validate coupon. Please try again.';
        },
      });
  }

  coinsToDiscount(coins: number): number {
    return coins * 0.5;
  }

  private validateCoins(): void {
    if (!this.loyaltyAccount) {
      this.loyaltyError = '';
      this.maxRedeemableCoins = 0;
      return;
    }

    // Don't validate if baseAmount is 0 (data not loaded yet)
    if (this.baseAmount === 0) {
      console.log('Base amount is 0, skipping validation');
      return;
    }

    // Get max redeemable from backend
    this.loyaltyService
      .validateRedeem(this.userId, this.coinsToRedeem || 1, this.baseAmount)
      .subscribe({
        next: (result) => {
          this.maxRedeemableCoins = result.maxAllowed;
          if (this.coinsToRedeem === 0) {
            this.loyaltyError = '';
            return;
          }
          if (!result.valid) {
            this.loyaltyError = result.error || 'Invalid redemption';
            if (result.maxAllowed < this.coinsToRedeem) {
              this.coinsToRedeem = result.maxAllowed;
            }
          } else {
            this.loyaltyError = '';
          }
        },
        error: () => {
          this.loyaltyError = 'Unable to validate coins. Please try again.';
          this.maxRedeemableCoins = 0;
        },
      });
  }

  generateReference(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `HTL-${ts}-${rand}`;
  }

  loadRazorpayScript(): void {
    if (typeof Razorpay !== 'undefined') return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }

  razorpayPaymentId = '';

  openRazorpayCheckout(): void {
    if (typeof Razorpay === 'undefined') {
      this.toast(
        'Razorpay is not loaded. Please refresh and try again.',
        'error',
      );
      return;
    }
    const options = {
      key: 'rzp_test_SozdiTBvohiEK8',
      amount: Math.round(this.finalTotal * 100),
      currency: 'INR',
      name: 'Raahi Hotels',
      description: `${this.roomCount} Room(s) · ${this.hotelName}`,
      image: '/favicon.ico',
      handler: (response: any) => {
        this.ngZone.run(() => {
          this.razorpayPaymentId = response.razorpay_payment_id ?? '';
          this.processBooking('razorpay');
        });
      },
      prefill: {
        name: this.firstName + ' ' + this.lastName,
        email: this.email,
        contact: this.phone.replace(/\s/g, ''),
      },
      notes: { bookingType: 'hotel', hotelId: this.hotelId },
      theme: { color: '#0077b6' },
      modal: {
        ondismiss: () => {
          this.paymentState.set('idle');
        },
      },
    };
    const rzp = new Razorpay(options);
    rzp.open();
  }

  async confirmBooking(): Promise<void> {
    if (
      this.selectedPayment === 'wallet' &&
      this.walletBalance < this.finalTotal
    ) {
      this.toast('Insufficient wallet balance.', 'error');
      return;
    }
    if (this.selectedPayment === 'razorpay') {
      this.openRazorpayCheckout();
      return;
    }
    await this.processBooking('wallet');
  }

  private async processBooking(method: string): Promise<void> {
    this.paymentState.set('processing');
    this.isLoading = true;
    await this.delay(2200);

    const ref = this.generateReference();

    const booking = {
      userId: this.userId,
      hotelId: this.hotelId,
      hotelName: this.hotelName,
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      numNights: this.nights,
      numAdults: this.totalGuests,
      rooms: this.rooms.map((r) => ({
        roomId: r.roomId,
        roomType: r.roomType,
        bedType: r.bedType,
        pricePerNight: r.pricePerNight,
      })),
      guests: [
        {
          firstName: this.firstName,
          lastName: this.lastName,
          isPrimary: true,
          idType: 'Aadhaar',
          idNumber: this.aadhaar,
        },
      ],
      pricing: {
        baseAmount: this.baseAmount,
        taxAmount: this.taxAmount,
        discountAmount: this.couponDiscount + this.coinDiscount,
        totalAmount: this.finalTotal,
        currency: 'INR',
      },
      couponCode: this.hasCoupon ? this.couponCode : null,
      couponDiscount: this.couponDiscount,
      coinsRedeemed: this.hasCoupon ? 0 : this.coinsToRedeem,
      coinsEarned: this.coinsEarned,
      bookingReference: ref,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: method,
      bookedAt: new Date().toISOString(),
    };

    try {
      console.log('📋 Step 1: Creating booking...', { method, ref });
      await firstValueFrom(this.hotelService.createBooking(booking));
      console.log('✅ Step 1 done');

      // Wallet: deduct balance. Razorpay: payment collected by gateway — no wallet deduction.
      if (method === 'wallet') {
        console.log('💳 Step 2: Deducting from wallet...');
        await firstValueFrom(
          this.hotelService.deductFromWallet(
            this.walletId,
            this.walletBalance,
            this.finalTotal,
            this.walletTransactions,
            ref,
          ),
        );
        console.log('✅ Step 2 done');
      } else {
        console.log('💳 Step 2: Razorpay — skipping wallet deduction');
      }

      if (!this.hasCoupon && this.coinsToRedeem > 0) {
        console.log('🪙 Step 3: Redeeming coins...');
        await firstValueFrom(
          this.loyaltyService.redeemCoins(
            this.userId,
            this.coinsToRedeem,
            ref,
            this.finalTotal,
            'hotel',
          ),
        ).catch((e) => console.warn('⚠️ Coin redeem failed (non-fatal):', e));
        console.log('✅ Step 3 done');
      }

      console.log('🎁 Step 4: Awarding coins...');
      await firstValueFrom(
        this.loyaltyService.awardCoins(
          this.userId,
          this.finalTotal,
          ref,
          'hotel',
        ),
      ).catch((e) => console.warn('⚠️ Coin award failed (non-fatal):', e));
      console.log('✅ Step 4 done');

      console.log('🏨 Step 5: Updating room status...');
      for (const room of this.rooms) {
        await firstValueFrom(
          this.hotelService.updateRoomStatus(room.roomId),
        ).catch((e) =>
          console.warn('⚠️ Room status update failed (non-fatal):', e),
        );
      }
      console.log('✅ Step 5 done');

      this.paymentState.set('confirmed');
      await this.delay(2000);

      this.isLoading = false;
      this.isBooked = true;
      this.paymentState.set('idle');
      this.bookingReference = ref;
      this.bookedAtDate = new Date();
      this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(JSON.stringify({ ref, hotel: this.hotelName, room: this.roomType, checkIn: this.checkIn, checkOut: this.checkOut, guest: this.firstName + ' ' + this.lastName }))}`;
      this.hotelService.clearBookingState();
      document.body.style.overflow = 'auto';

      // Scroll to top to show ticket
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('❌ processBooking failed:', err);
      console.error('❌ Error message:', err?.message);
      console.error('❌ Error status:', err?.status);
      console.error('❌ Error body:', err?.error);
      this.isLoading = false;
      this.paymentState.set('idle');
      this.toast('Booking failed. Please try again.', 'error');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  goBackToDetail(): void {
    this.saveGuestToState();
    const state = this.hotelService.getBookingState();
    this.router.navigate(['/hotel', this.hotelId], {
      queryParams: {
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        rooms: this.roomCount,
        adults: state?.guests ?? 1,
        children: state?.children ?? 0,
        infants: state?.infants ?? 0,
      },
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  downloadTicket(): void {
    window.print();
  }

  private toast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 3000);
  }
}
