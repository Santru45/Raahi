import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TransportService } from '../travel.service';
import { SeatSelectionComponent } from './seat-selection/seat-selection.component';
import { BoardingPointComponent } from './boarding-point/boarding-point.component';
import { PassengerFormComponent } from './passenger-form/passenger-form.component';
import { BookingSummaryComponent } from './booking-summary/booking-summary.component';

type BookingStep = 'seat' | 'boarding' | 'passenger' | 'summary';

@Component({
  selector: 'app-travel-booking',
  standalone: true,
  imports: [
    SeatSelectionComponent,
    BoardingPointComponent,
    PassengerFormComponent,
    BookingSummaryComponent,
  ],
  templateUrl: './travel-booking.component.html',
  styleUrl: './travel-booking.component.scss',
})
export class TravelBookingComponent implements OnInit {
  transportService = inject(TransportService);
  private router = inject(Router);

  currentStep = signal<BookingStep>(this.getFirstStep());

  ngOnInit(): void {
    // Check if passenger data exists (user returning after login)
    // If so, jump directly to summary
    if (this.transportService.passengerData().length > 0) {
      this.currentStep.set('summary');
    }
  }

  // Determine first step based on mode
  getFirstStep(): BookingStep {
    const mode: string = this.transportService.selectedMode();
    if (mode === 'train') return 'passenger';
    return 'seat';
  }

  // Seat confirmed → next step
  onSeatConfirmed(seatIds: string[]): void {
    console.log('Seat confirmed:', seatIds);
    const mode: string = this.transportService.selectedMode();
    console.log('Mode:', mode);
    console.log('Setting step to:', mode === 'bus' ? 'boarding' : 'passenger');

    if (mode === 'bus') {
      this.currentStep.set('boarding');
    } else {
      this.currentStep.set('passenger');
    }

    console.log('Current step now:', this.currentStep());
  }

  // Boarding points confirmed → passenger form
  onPointsConfirmed(points: { boarding: string; dropping: string }): void {
    this.currentStep.set('passenger');
  }

  // Passenger form submitted → summary
  onPassengersSubmitted(): void {
    this.transportService['saveBookingStateToStorage']();
    this.currentStep.set('summary');
  }

  // Go back to results page
  onBackToResults(): void {
    this.transportService.selectedTrip.set(null);
    this.transportService.selectedSeat.set(null);
    this.router.navigate(['/travel/results']);
  }

  // Go back one step
  onBack(): void {
    const mode: string = this.transportService.selectedMode();
    const step = this.currentStep();

    if (step === 'summary') {
      this.currentStep.set('passenger');
    } else if (step === 'passenger') {
      if (mode === 'bus') this.currentStep.set('boarding');
      else if (mode === 'flight') this.currentStep.set('seat');
      else this.onBackToResults();
    } else if (step === 'boarding') {
      this.currentStep.set('seat');
    } else if (step === 'seat') {
      this.onBackToResults();
    }
  }

  // Step labels for progress indicator
  get steps(): string[] {
    const mode: string = this.transportService.selectedMode();
    if (mode === 'bus') return ['Seat', 'Boarding', 'Passengers', 'Summary'];
    if (mode === 'flight') return ['Seat', 'Passengers', 'Summary'];
    return ['Passengers', 'Summary'];
  }

  // Current step index for progress indicator
  get currentStepIndex(): number {
    const mode: string = this.transportService.selectedMode();
    const step = this.currentStep();

    if (mode === 'bus') {
      return { seat: 0, boarding: 1, passenger: 2, summary: 3 }[step];
    } else if (mode === 'flight') {
      return { seat: 0, passenger: 1, summary: 2, boarding: 0 }[step];
    }
    return { passenger: 0, summary: 1, seat: 0, boarding: 0 }[step];
  }
}
