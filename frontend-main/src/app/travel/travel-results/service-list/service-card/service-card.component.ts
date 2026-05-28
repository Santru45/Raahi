// src/app/components/travel/service-card/service-card.component.ts

import { Component, input, output } from '@angular/core';
import { TravelService } from '../../../travel.model';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [],
  templateUrl: './service-card.component.html',
  styleUrl: './service-card.component.scss',
})
export class ServiceCardComponent {
  // Input: receives a single trip from ServiceListComponent
  trip = input.required<TravelService>();

  // Output: emits the selected trip back to the parent
  tripSelected = output<TravelService>();

  // How much cheaper than market rate
  get savings(): number {
    return this.trip().marketRate - this.trip().fare;
  }

  // Calculate actual available seats
  get availableSeatsCount(): number {
    const bookedCount = this.trip().bookedSeats?.length || 0;
    return this.trip().totalSeats - bookedCount;
  }

  // True when less than 10 seats/berths left
  get isLowAvailability(): boolean {
    return this.availableSeatsCount < 10;
  }

  // "berths" for trains, "seats" for flights and buses
  get seatLabel(): string {
    return this.trip().type === 'train' ? 'berths' : 'seats';
  }

  // Converts ISO string "2026-04-10T06:00:00.000Z" → "06:00 AM"
  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Emit the trip when user clicks "Select"
  onSelect(): void {
    this.tripSelected.emit(this.trip());
  }
}
