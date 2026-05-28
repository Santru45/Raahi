import { LoyaltyComponent } from './loyalty/loyalty.component';
import { Component, inject, OnInit, NgZone } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { BookingHistoryService } from '../core/booking-history.service';
import { User } from '../core/user.model';
import { CustomerBookingSummary } from '../booking/booking.model';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { UserService } from './user.service';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../hotel/hotel.service';

declare var Razorpay: any;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    LoyaltyComponent,
    FormsModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private bookingHistoryService = inject(BookingHistoryService);
  private hotelService = inject(HotelService);
  private route = inject(ActivatedRoute);
  private ngZone = inject(NgZone);

  customerBookings: CustomerBookingSummary[] = [];
  isLoading = true;
  showDeleteConfirm = false;
  // Wallet state
  wallet: any = null;
  walletLoading = true;
  showTopUp = false;
  topUpAmount: number | null = null;
  topUpLoading = false;
  topUpError = '';
  topUpSuccess = '';
  showTransactions = false;

  get user() {
    return this.authService.getCurrentUser();
  }

  bookingError = '';
  deleteError = '';

  deleteAccount() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.deleteError = '';
    this.userService.deleteUserById(user._id).subscribe({
      next: () => {
        this.authService.logout();
      },
      error: (err) => {
        console.log('Delete error:', err);
        this.deleteError = 'Failed to delete account. Please try later.';
        setTimeout(() => (this.deleteError = ''), 4000);
      },
    });
  }

  loadWallet() {
    if (!this.user) return;
    this.walletLoading = true;
    this.hotelService.getWalletByUserId(this.user._id).subscribe({
      next: (wallet) => {
        this.wallet = wallet;
        this.walletLoading = false;
      },
      error: () => {
        this.walletLoading = false;
      },
    });
  }

  topUp(razorpayPaymentId = '') {
    if (!this.topUpAmount || this.topUpAmount <= 0 || !this.wallet) {
      this.topUpError = 'Please enter a valid amount.';
      return;
    }
    if (this.topUpAmount > 100000) {
      this.topUpError = 'Maximum top-up is ₹1,00,000 at a time.';
      return;
    }

    this.topUpError = '';
    this.topUpLoading = true;

    const newBalance = this.wallet.balance + this.topUpAmount;

    // Optimistic update to navbar
    this.hotelService.walletBalance.set(newBalance);

    const newTransaction = {
      id: `txn_${Date.now()}`,
      type: 'topup',
      amount: this.topUpAmount,
      balanceAfter: newBalance,
      description: `Wallet top-up via Razorpay${razorpayPaymentId ? ' (' + razorpayPaymentId + ')' : ''}`,
    };
    const updatedTransactions = [
      ...(this.wallet.transactions || []),
      newTransaction,
    ];

    // Reuse the existing DAO method via HotelService
    this.hotelService['dao']
      .updateWalletBalance(this.wallet._id, newBalance, updatedTransactions)
      .subscribe({
        next: (updated: any) => {
          this.wallet = {
            ...this.wallet,
            balance: newBalance,
            transactions: updatedTransactions,
          };
          // Confirm signal update (already done optimistically)
          this.hotelService.walletBalance.set(newBalance);
          this.topUpLoading = false;
          this.showTopUp = false;
          const added = this.topUpAmount;
          this.topUpAmount = null;
          this.topUpSuccess = `₹${(added ?? 0).toLocaleString('en-IN')} added to your wallet!`;
          setTimeout(() => (this.topUpSuccess = ''), 4000);
        },
        error: () => {
          // Revert optimistic update on error
          this.hotelService.walletBalance.set(this.wallet.balance);
          this.topUpError = 'Top-up failed. Please try again.';
          this.topUpLoading = false;
        },
      });
  }

  cancelTopUp() {
    this.showTopUp = false;
    this.topUpAmount = null;
    this.topUpError = '';
    this.topUpSuccess = '';
  }

  loadRazorpayScript(): void {
    if (typeof Razorpay !== 'undefined') return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }

  openRazorpayCheckout(): void {
    if (!this.topUpAmount || this.topUpAmount <= 0) {
      this.topUpError = 'Please enter a valid amount.';
      return;
    }
    if (this.topUpAmount > 100000) {
      this.topUpError = 'Maximum top-up is ₹1,00,000 at a time.';
      return;
    }
    this.topUpError = '';
    if (typeof Razorpay === 'undefined') {
      this.topUpError = 'Razorpay is not loaded. Please refresh and try again.';
      return;
    }
    const user = this.user;
    const options = {
      key: 'rzp_test_SozdiTBvohiEK8',
      amount: Math.round(this.topUpAmount * 100),
      currency: 'INR',
      name: 'Raahi',
      description: 'Wallet Top-Up',
      image: '/favicon.ico',
      handler: (response: any) => {
        this.ngZone.run(() => {
          this.topUp(response.razorpay_payment_id ?? '');
        });
      },
      prefill: {
        name: user?.name ?? '',
        email: user?.email ?? '',
      },
      notes: { type: 'wallet_topup', userId: user?._id },
      theme: { color: '#0077b6' },
      modal: {
        ondismiss: () => {
          this.ngZone.run(() => {
            this.topUpLoading = false;
          });
        },
      },
    };
    const rzp = new Razorpay(options);
    rzp.open();
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['topup'] === '1') {
        this.showTopUp = true;
        setTimeout(() => {
          document
            .getElementById('wallet-section')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
      }
    });

    if (this.user) {
      console.log('User found:', this.user);
      this.bookingHistoryService.getBookingHistory(this.user._id).subscribe({
        next: (bookings) => {
          console.log('[DEBUG] bookings received:', bookings);
          this.customerBookings = bookings;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('[DEBUG] getBookingHistory error:', err);
          this.bookingError = 'Unable to load bookings. Please try later.';
          this.isLoading = false;
        },
      });

      if (this.user.role === 'customer') {
        this.loadWallet();
        this.loadRazorpayScript();
      }
    }
  }
}
