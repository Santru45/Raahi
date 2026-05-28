import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HotelService } from '../hotel.service';
import { AuthService } from '../../auth/auth.service';
import { LoyaltyService } from '../../profile/loyalty/loyalty-service';
import { TravelDAO } from '../../travel/travel.dao';
import { ItineraryService } from '../../itineraries/itinerary.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-hotel-my-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hotel-my-bookings.component.html',
  styleUrl: './hotel-my-bookings.component.scss',
})
export class HotelMyBookingsComponent implements OnInit {
  hotelBookings: any[] = [];
  travelBookings: any[] = [];
  private hotelBookingsLoaded = false;
  private travelBookingsLoaded = false;
  loading = true;
  error = '';

  activeTab: 'hotel' | 'travel' = 'hotel';
  searchQuery = '';
  statusFilter: 'all' | 'confirmed' | 'cancelled' = 'all';
  hotelPage = 1;
  travelPage = 1;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  showConfirmModal = false;
  bookingToCancel: any = null;
  bookingType: 'hotel' | 'travel' = 'hotel';
  isCancelling = false;

  showHotelTicketModal = false;
  selectedHotelBooking: any = null;
  hotelQrUrl = '';

  showTicketModal = false;
  selectedTicket: any = null;

  private auth = inject(AuthService);
  userId = this.auth.getCurrentUser()?._id ?? '';
  router = inject(Router);
  hotelService = inject(HotelService);
  loyaltyService = inject(LoyaltyService);
  travelDao = inject(TravelDAO);
  itineraryService = inject(ItineraryService);

  ngOnInit(): void {
    document.body.style.overflow = 'auto';
    this.loadHotelBookings();
    this.loadTravelBookings();
  }

  private loadHotelBookings(): void {
    this.hotelService.getMyBookings(this.userId).subscribe({
      next: (data) => {
        this.hotelBookings = data.sort(
          (a: any, b: any) =>
            new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime(),
        );
        this.hotelBookingsLoaded = true;
        this.checkLoadingComplete();
      },
      error: () => {
        this.hotelBookings = [];
        this.hotelBookingsLoaded = true;
        this.checkLoadingComplete();
      },
    });
  }

  private loadTravelBookings(): void {
    this.travelDao.getMyTravelBookings(this.userId).subscribe({
      next: (data) => {
        this.travelBookings = data.sort(
          (a: any, b: any) =>
            new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime(),
        );
        this.travelBookingsLoaded = true;
        this.checkLoadingComplete();
      },
      error: () => {
        this.travelBookings = [];
        this.travelBookingsLoaded = true;
        this.checkLoadingComplete();
      },
    });
  }

  private checkLoadingComplete(): void {
    if (this.hotelBookingsLoaded && this.travelBookingsLoaded)
      setTimeout(() => (this.loading = false), 0);
  }

  private filterBookings(list: any[], queryFields: string[]): any[] {
    let result =
      this.statusFilter !== 'all'
        ? list.filter((b) => b.bookingStatus === this.statusFilter)
        : list;
    const q = this.searchQuery.trim().toLowerCase();
    if (q)
      result = result.filter((b) =>
        queryFields.some((field) =>
          String(field.split('.').reduce((o: any, k) => o?.[k], b) ?? '')
            .toLowerCase()
            .includes(q),
        ),
      );
    return result;
  }

  get filteredHotelBookings(): any[] {
    return this.filterBookings(this.hotelBookings, [
      'hotelName',
      'bookingReference',
      'roomSnapshot.roomType',
    ]);
  }
  get filteredTravelBookings(): any[] {
    return this.filterBookings(this.travelBookings, [
      'serviceSnapshot.operatorName',
      'serviceSnapshot.serviceNumber',
      'serviceSnapshot.from',
      'serviceSnapshot.to',
      'bookingReference',
    ]);
  }

  get pagedHotelBookings(): any[] {
    const s = (this.hotelPage - 1) * PAGE_SIZE;
    return this.filteredHotelBookings.slice(s, s + PAGE_SIZE);
  }
  get pagedTravelBookings(): any[] {
    const s = (this.travelPage - 1) * PAGE_SIZE;
    return this.filteredTravelBookings.slice(s, s + PAGE_SIZE);
  }

  get totalHotelPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredHotelBookings.length / PAGE_SIZE),
    );
  }
  get totalTravelPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredTravelBookings.length / PAGE_SIZE),
    );
  }

  private pageRange(cur: number, total: number): number[] {
    const r: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++)
      r.push(i);
    return r;
  }
  hotelPageNumbers(): number[] {
    return this.pageRange(this.hotelPage, this.totalHotelPages);
  }
  travelPageNumbers(): number[] {
    return this.pageRange(this.travelPage, this.totalTravelPages);
  }

  setHotelPage(p: number): void {
    this.hotelPage = Math.min(Math.max(1, p), this.totalHotelPages);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  setTravelPage(p: number): void {
    this.travelPage = Math.min(Math.max(1, p), this.totalTravelPages);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  onFilterChange(): void {
    this.hotelPage = 1;
    this.travelPage = 1;
  }

  setTab(tab: 'hotel' | 'travel'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.hotelPage = 1;
    this.travelPage = 1;
  }

  promptCancel(booking: any, type: 'hotel' | 'travel', event: Event): void {
    event.stopPropagation();
    this.bookingToCancel = booking;
    this.bookingType = type;
    this.showConfirmModal = true;
  }
  dismissCancel(): void {
    this.bookingToCancel = null;
    this.showConfirmModal = false;
  }

  async confirmCancel(): Promise<void> {
    if (!this.bookingToCancel) return;
    const booking = this.bookingToCancel;
    this.isCancelling = true;
    try {
      if (this.bookingType === 'hotel') {
        await firstValueFrom(this.hotelService.cancelBooking(booking._id));
        booking.bookingStatus = 'cancelled';
        // Coins clawback is handled server-side in cancelHotelBooking controller
        // (proportional to refund tier: 100%/50%/0% refund → 0%/50%/100% clawback)
        if (booking.rooms?.length) {
          for (const r of booking.rooms)
            await firstValueFrom(this.hotelService.setRoomAvailable(r.roomId));
        } else if (booking.roomId)
          await firstValueFrom(
            this.hotelService.setRoomAvailable(booking.roomId),
          );
      } else {
        const travelPolicy = this.getTravelCancellationPolicy(booking);
        await firstValueFrom(
          this.travelDao.cancelTravelBooking(
            booking._id,
            travelPolicy.refundPct,
          ),
        );
        booking.bookingStatus = 'cancelled';
        // Coins clawback is handled server-side in cancelTravelBooking controller
      }

      // Optimistically delete synced itinerary items for this booking
      if (booking.bookingReference) {
        this.itineraryService
          .deleteSyncedItemsByBookingRef(booking.bookingReference)
          .subscribe({
            next: (result) => {
              if (result.deleted > 0) {
                console.log(
                  `Deleted ${result.deleted} synced itinerary item(s)`,
                );
              }
            },
            error: (err) =>
              console.error('Failed to delete synced items:', err),
          });
      }

      this.toast('Booking cancelled successfully', 'success');
      // Refresh navbar coin count after any cancellation (server may have clawed back coins)
      if (this.userId) this.loyaltyService.refreshCoinBalance(this.userId);
    } catch {
      this.toast('Cancellation failed. Please try again.', 'error');
    }
    this.isCancelling = false;
    this.showConfirmModal = false;
    this.bookingToCancel = null;
  }

  isCancellable(booking: any, type: 'hotel' | 'travel'): boolean {
    if (booking.bookingStatus !== 'confirmed') return false;
    if (type === 'hotel') {
      if (new Date().getTime() >= new Date(booking.checkIn).getTime())
        return false;
    } else {
      const dep = booking.serviceSnapshot?.departureTime;
      if (dep && new Date().getTime() >= new Date(dep).getTime()) return false;
    }
    return true;
  }

  getTravelCancellationPolicy(booking: any): {
    tier: string;
    refundPct: number;
    label: string;
    color: string;
    detail: string;
    coinClawbackPct: number;
    coinNote: string;
  } {
    const dep = booking.serviceSnapshot?.departureTime;
    const hoursUntilDeparture = dep
      ? (new Date(dep).getTime() - Date.now()) / (1000 * 60 * 60)
      : 999;
    const coinsEarned = booking.coinsEarned ?? 0;
    const coinsRedeemed = booking.coinsRedeemed ?? 0;

    if (hoursUntilDeparture >= 24) {
      const coinNote =
        coinsEarned > 0 || coinsRedeemed > 0
          ? `All ${coinsEarned} earned coins will be clawed back — full refund means no net spend.${coinsRedeemed > 0 ? ' ' + coinsRedeemed + ' redeemed coins fully reinstated.' : ''}`
          : 'No coins were involved in this booking.';
      return {
        tier: 'free',
        refundPct: 100,
        label: 'Full Refund',
        color: '#065f46',
        detail: 'Cancel 24+ hours before departure for a complete refund.',
        coinClawbackPct: 100,
        coinNote,
      };
    } else if (hoursUntilDeparture >= 6) {
      const clawback = Math.round(coinsEarned * 0.5);
      const reinstate = Math.round(coinsRedeemed * 0.5);
      const coinNote =
        coinsEarned > 0 || coinsRedeemed > 0
          ? `${clawback} of ${coinsEarned} earned coins clawed back (50%).${reinstate > 0 ? ' ' + reinstate + ' of ' + coinsRedeemed + ' redeemed coins reinstated.' : ''}`
          : 'No coins were involved in this booking.';
      return {
        tier: 'partial',
        refundPct: 50,
        label: '50% Refund',
        color: '#92400e',
        detail: 'Cancelling 6–24 hours before departure gives a 50% refund.',
        coinClawbackPct: 50,
        coinNote,
      };
    } else if (hoursUntilDeparture >= 2) {
      const clawback = Math.round(coinsEarned * 0.25);
      const coinNote =
        coinsEarned > 0
          ? `${clawback} of ${coinsEarned} earned coins clawed back (25%).`
          : 'No coins were involved in this booking.';
      return {
        tier: 'low',
        refundPct: 25,
        label: '25% Refund',
        color: '#b45309',
        detail: 'Cancelling 2–6 hours before departure gives a 25% refund.',
        coinClawbackPct: 25,
        coinNote,
      };
    } else {
      const coinNote =
        coinsEarned > 0
          ? `${coinsEarned} earned coins are yours to keep — you paid in full (no refund).`
          : 'No coins were involved in this booking.';
      return {
        tier: 'none',
        refundPct: 0,
        label: 'No Refund',
        color: '#991b1b',
        detail: 'Cancellations within 2 hours of departure are non-refundable.',
        coinClawbackPct: 0,
        coinNote,
      };
    }
  }

  /** Returns cancellation policy including coin clawback info */
  getCancellationPolicy(booking: any): {
    tier: string;
    refundPct: number;
    label: string;
    color: string;
    detail: string;
    coinClawbackPct: number;
    coinNote: string;
  } {
    const hoursUntilCheckIn =
      (new Date(booking.checkIn).getTime() - Date.now()) / (1000 * 60 * 60);
    const coinsEarned = booking.coinsEarned ?? 0;
    const coinsRedeemed = booking.coinsRedeemed ?? 0;
    if (hoursUntilCheckIn >= 48) {
      // 100% refund → 100% clawback (paid nothing net, coins unearned)
      const coinNote =
        coinsEarned > 0 || coinsRedeemed > 0
          ? `All ${coinsEarned} earned coins will be clawed back — full refund means no net spend.${coinsRedeemed > 0 ? ' ' + coinsRedeemed + ' redeemed coins fully reinstated.' : ''}`
          : 'No coins were involved in this booking.';
      return {
        tier: 'free',
        refundPct: 100,
        label: 'Full Refund',
        color: '#065f46',
        detail: 'Cancel 48+ hours before check-in for a complete refund.',
        coinClawbackPct: 100,
        coinNote,
      };
    } else if (hoursUntilCheckIn >= 24) {
      // 50% refund → 50% clawback
      const clawback = Math.round(coinsEarned * 0.5);
      const reinstate = Math.round(coinsRedeemed * 0.5);
      const coinNote =
        coinsEarned > 0 || coinsRedeemed > 0
          ? `${clawback} of ${coinsEarned} earned coins clawed back (50% refund).${reinstate > 0 ? ' ' + reinstate + ' of ' + coinsRedeemed + ' redeemed coins reinstated.' : ''}`
          : 'No coins were involved in this booking.';
      return {
        tier: 'partial',
        refundPct: 50,
        label: '50% Refund',
        color: '#92400e',
        detail: 'Cancelling 24–48 hours before check-in gives a 50% refund.',
        coinClawbackPct: 50,
        coinNote,
      };
    } else {
      // 0% refund → 0% clawback (user paid in full, coins legitimately earned)
      const coinNote =
        coinsEarned > 0
          ? `${coinsEarned} earned coins are yours to keep — you paid in full (no refund).`
          : 'No coins were involved in this booking.';
      return {
        tier: 'none',
        refundPct: 0,
        label: 'No Refund',
        color: '#991b1b',
        detail: 'Cancellations within 24 hours of check-in are non-refundable.',
        coinClawbackPct: 0,
        coinNote,
      };
    }
  }

  viewHotel(booking: any): void {
    this.selectedHotelBooking = booking;
    this.hotelQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(JSON.stringify({ ref: booking.bookingReference, hotel: booking.hotelName, checkIn: booking.checkIn, checkOut: booking.checkOut }))}`;
    this.showHotelTicketModal = true;
  }
  closeHotelTicketModal(): void {
    this.showHotelTicketModal = false;
    this.selectedHotelBooking = null;
  }
  downloadHotelTicket(): void {
    window.print();
  }

  viewTicket(booking: any, event: Event): void {
    event.stopPropagation();
    this.selectedTicket = booking;
    this.showTicketModal = true;
  }
  closeTicketModal(): void {
    this.showTicketModal = false;
    this.selectedTicket = null;
  }
  downloadTicket(booking: any): void {
    window.print();
  }

  getModeIcon(type: string): string {
    if (type === 'flight') return 'bi-airplane-fill';
    if (type === 'train') return 'bi-train-front-fill';
    if (type === 'bus') return 'bi-bus-front-fill';
    return 'bi-ticket-perforated';
  }

  statusBg(s: string): string {
    return s === 'confirmed'
      ? '#d1fae5'
      : s === 'cancelled'
        ? '#fee2e2'
        : '#dbeafe';
  }
  statusFg(s: string): string {
    return s === 'confirmed'
      ? '#065f46'
      : s === 'cancelled'
        ? '#991b1b'
        : '#1e40af';
  }

  goToHotels(): void {
    this.router.navigate(['/hotel']);
  }

  private toast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 3000);
  }
}
