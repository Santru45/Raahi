// booking-success.component.ts

import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { TransportService } from '../travel.service';

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [DatePipe, TitleCasePipe],
  templateUrl: './booking-success.component.html',
  styleUrl: './booking-success.component.scss',
})
export class BookingSuccessComponent implements OnInit {
  transportService = inject(TransportService);
  private router = inject(Router);

  booking: any = null;
  qrCodeUrl = '';

  ngOnInit(): void {
    this.booking = this.transportService.lastBookingResult();

    if (!this.booking) {
      // No booking data — user navigated here directly
      this.router.navigate(['/travel']);
      return;
    }

    // Generate QR code using a free API
    // Encodes the booking reference into a QR image
    const qrData = encodeURIComponent(
      JSON.stringify({
        ref: this.booking.bookingReference,
        ticket: this.booking.ticketId,
        route: `${this.booking.serviceSnapshot.from} → ${this.booking.serviceSnapshot.to}`,
        operator: this.booking.serviceSnapshot.operatorName,
        date: this.booking.serviceSnapshot.departureTime,
        pax: this.booking.passengers.length,
      }),
    );
    this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrData}`;
  }

  // ─── Helpers ───────────────────────────────────────────
  get snapshot() {
    return this.booking?.serviceSnapshot;
  }

  get passengers(): any[] {
    return this.booking?.passengers ?? [];
  }

  get pricing() {
    return this.booking?.pricing;
  }

  get modeIcon(): string {
    const type = this.snapshot?.type;
    if (type === 'flight') return 'bi-airplane-fill';
    if (type === 'train') return 'bi-train-front-fill';
    return 'bi-bus-front-fill';
  }

  get modeLabel(): string {
    const type = this.snapshot?.type;
    if (type === 'flight') return 'Flight';
    if (type === 'train') return 'Train';
    return 'Bus';
  }

  get hasBoardingPoint(): boolean {
    return (
      !!this.booking?.boardingPoint && this.booking.boardingPoint !== 'N/A'
    );
  }

  get hasLoyaltyDiscount(): boolean {
    return (this.pricing?.loyaltyDiscount ?? 0) > 0;
  }

  // ─── Actions ───────────────────────────────────────────
  bookAnother(): void {
    this.transportService.lastBookingResult.set(null);
    this.router.navigate(['/']);
  }

  downloadTicket(): void {
    // Trigger browser print which user can save as PDF
    window.print();
  }
}
