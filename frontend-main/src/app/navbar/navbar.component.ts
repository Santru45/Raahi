import { Component, inject, HostListener, effect, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { LoyaltyService } from '../profile/loyalty/loyalty-service';
import { HotelService } from '../hotel/hotel.service';

declare var Razorpay: any;

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  private loyaltyService = inject(LoyaltyService);
  hotelService = inject(HotelService); // Make public for getter access
  private ngZone = inject(NgZone);

  isScrolled = false;
  menuOpen = false;
  profileOpen = false;
  walletOpen = false;

  /** Read wallet balance reactively from the shared signal */
  get walletBalance(): number | null {
    return this.hotelService.walletBalance();
  }

  private wallet: any = null;
  private lastUserId = '';

  // Wallet top-up state
  showTopUpForm = false;
  topUpAmount: number | null = null;
  topUpLoading = false;
  topUpError = '';
  topUpSuccess = '';
  showLogoutConfirm = false;

  /** Read coins reactively from the shared signal */
  get loyaltyCoins(): number | null {
    return this.loyaltyService.coinBalance();
  }

  constructor() {
    effect(
      () => {
        const user = this.authService.user();
        if (!user?._id) {
          this.loyaltyService.coinBalance.set(null);
          this.hotelService.walletBalance.set(null);
          this.lastUserId = '';
          return;
        }
        if (user._id === this.lastUserId) return;
        this.lastUserId = user._id;

        this.loyaltyService.refreshCoinBalance(user._id);
        this.loadWallet(user._id);
        this.loadRazorpayScript();
      },
      { allowSignalWrites: true },
    );
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 20;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    this.profileOpen = false;
  }
  openProfile(): void {
    if (this.walletOpen) return;
    this.profileOpen = true;
  }
  closeProfile(): void {
    this.profileOpen = false;
  }
  closeAll(): void {
    this.menuOpen = false;
    this.profileOpen = false;
    this.walletOpen = false;
  }

  openWallet(): void {
    this.walletOpen = true;
    this.profileOpen = false;
    this.topUpError = '';
  }

  closeWallet(): void {
    // Don't auto-close if user is mid-transaction
    if (this.showTopUpForm || this.topUpLoading) return;
    this.walletOpen = false;
  }

  // ── Wallet top-up logic ─────────────────────────────────────
  private loadWallet(userId: string): void {
    this.hotelService.getWalletByUserId(userId).subscribe({
      next: (w) => {
        this.wallet = w;
        // walletBalance is now handled by the signal in the service
      },
      error: () => this.hotelService.walletBalance.set(0),
    });
  }

  private loadRazorpayScript(): void {
    if (typeof Razorpay !== 'undefined') return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }

  openRazorpayTopUp(): void {
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
      this.topUpError = 'Payment gateway not loaded. Please refresh.';
      return;
    }
    const user = this.authService.getCurrentUser();
    const options = {
      key: 'rzp_test_SozdiTBvohiEK8',
      amount: Math.round(this.topUpAmount * 100),
      currency: 'INR',
      name: 'Raahi',
      description: 'Wallet Top-Up',
      image: '/favicon.ico',
      handler: (response: any) => {
        this.ngZone.run(() =>
          this.processTopUp(response.razorpay_payment_id ?? ''),
        );
      },
      prefill: { name: user?.name ?? '', email: user?.email ?? '' },
      notes: { type: 'wallet_topup', userId: user?._id },
      theme: { color: '#0077b6' },
      modal: {
        ondismiss: () => this.ngZone.run(() => (this.topUpLoading = false)),
      },
    };
    new Razorpay(options).open();
  }

  private processTopUp(razorpayPaymentId: string): void {
    if (!this.topUpAmount || !this.wallet) return;
    this.topUpLoading = true;
    const newBalance = this.wallet.balance + this.topUpAmount;

    // Optimistic update
    this.hotelService.walletBalance.set(newBalance);

    const newTxn = {
      id: `txn_${Date.now()}`,
      type: 'topup',
      amount: this.topUpAmount,
      balanceAfter: newBalance,
      description: `Wallet top-up via Razorpay${razorpayPaymentId ? ' (' + razorpayPaymentId + ')' : ''}`,
    };
    const updatedTxns = [...(this.wallet.transactions || []), newTxn];

    this.hotelService['dao']
      .updateWalletBalance(this.wallet._id, newBalance, updatedTxns)
      .subscribe({
        next: () => {
          const added = this.topUpAmount;
          this.wallet = {
            ...this.wallet,
            balance: newBalance,
            transactions: updatedTxns,
          };
          // Balance already updated optimistically
          this.topUpLoading = false;
          this.showTopUpForm = false;
          this.topUpAmount = null;
          this.topUpSuccess = `₹${(added ?? 0).toLocaleString('en-IN')} added!`;
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

  cancelTopUp(): void {
    this.showTopUpForm = false;
    this.topUpAmount = null;
    this.topUpError = '';
  }

  logout(): void {
    this.showLogoutConfirm = true;
    this.closeAll();
  }

  doLogout(): void {
    this.showLogoutConfirm = false;
    this.authService.logout();
  }

  cancelLogout(): void {
    this.showLogoutConfirm = false;
  }
}
