import { Component, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransportService } from '../travel.service';
import { ServiceListComponent } from './service-list/service-list.component';
import { TravelService } from '../travel.model';

@Component({
  selector: 'app-travel-results',
  standalone: true,
  imports: [ServiceListComponent, CommonModule, FormsModule],
  templateUrl: './travel-results.component.html',
  styleUrl: './travel-results.component.scss',
})
export class TravelResultsComponent {
  transportService = inject(TransportService);
  private router = inject(Router);

  // ─── Filter State ────────────────────────────────────
  sortBy = signal<string>('price-asc');
  maxPrice = signal<number>(0);
  priceRange = signal<number>(0);
  selectedOperators = signal<Set<string>>(new Set());
  selectedDepartures = signal<Set<string>>(new Set());
  showFilters = signal(false);

  // ─── Derived Data ────────────────────────────────────
  operators = computed(() => {
    const trips = this.transportService.availableTrips();
    return [...new Set(trips.map((t) => t.operatorName))].sort();
  });

  priceExtent = computed(() => {
    const trips = this.transportService.availableTrips();
    if (trips.length === 0) return { min: 0, max: 10000 };
    const fares = trips.map((t) => t.fare);
    return { min: Math.min(...fares), max: Math.max(...fares) };
  });

  filteredTrips = computed(() => {
    let trips = [...this.transportService.availableTrips()];
    const price = this.priceRange();
    const ops = this.selectedOperators();
    const deps = this.selectedDepartures();
    const sort = this.sortBy();

    // Init price range on first load
    if (price === 0 && trips.length > 0) {
      return this.applySorting(trips, sort);
    }

    // Price filter
    if (price > 0) {
      trips = trips.filter((t) => t.fare <= price);
    }

    // Operator filter
    if (ops.size > 0) {
      trips = trips.filter((t) => ops.has(t.operatorName));
    }

    // Departure time filter
    if (deps.size > 0) {
      trips = trips.filter((t) => {
        const hour = this.getHour(t.schedule.departureTime);
        if (deps.has('early') && hour >= 0 && hour < 6) return true;
        if (deps.has('morning') && hour >= 6 && hour < 12) return true;
        if (deps.has('afternoon') && hour >= 12 && hour < 18) return true;
        if (deps.has('night') && hour >= 18 && hour <= 23) return true;
        return false;
      });
    }

    return this.applySorting(trips, sort);
  });

  constructor() {
    // Restore search results from sessionStorage if page was reloaded
    this.transportService.restoreSearchResults();

    // Initialize price range when trips load
    const checkInit = setInterval(() => {
      const extent = this.priceExtent();
      if (extent.max > 0) {
        this.priceRange.set(extent.max);
        this.maxPrice.set(extent.max);
        clearInterval(checkInit);
      }
    }, 100);
    setTimeout(() => clearInterval(checkInit), 5000);
  }

  // ─── Filter Helpers ──────────────────────────────────
  toggleOperator(op: string): void {
    const current = new Set(this.selectedOperators());
    if (current.has(op)) current.delete(op);
    else current.add(op);
    this.selectedOperators.set(current);
  }

  toggleDeparture(slot: string): void {
    const current = new Set(this.selectedDepartures());
    if (current.has(slot)) current.delete(slot);
    else current.add(slot);
    this.selectedDepartures.set(current);
  }

  clearFilters(): void {
    this.sortBy.set('price-asc');
    this.priceRange.set(this.priceExtent().max);
    this.selectedOperators.set(new Set());
    this.selectedDepartures.set(new Set());
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.sortBy() !== 'price-asc') count++;
    if (this.priceRange() < this.priceExtent().max) count++;
    if (this.selectedOperators().size > 0) count++;
    if (this.selectedDepartures().size > 0) count++;
    return count;
  }

  private applySorting(trips: TravelService[], sort: string): TravelService[] {
    switch (sort) {
      case 'price-asc':
        return trips.sort((a, b) => a.fare - b.fare);
      case 'price-desc':
        return trips.sort((a, b) => b.fare - a.fare);
      case 'departure':
        return trips.sort(
          (a, b) =>
            this.getHour(a.schedule.departureTime) -
            this.getHour(b.schedule.departureTime),
        );
      case 'duration':
        return trips.sort(
          (a, b) =>
            this.parseDuration(a.schedule.duration) -
            this.parseDuration(b.schedule.duration),
        );
      case 'seats':
        return trips.sort((a, b) => b.availableSeats - a.availableSeats);
      default:
        return trips;
    }
  }

  private getHour(time: string): number {
    if (!time) return 0;
    const d = new Date(time);
    if (!isNaN(d.getTime())) return d.getHours();
    const match = time.match(/(\d{1,2}):(\d{2})/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private parseDuration(dur: string): number {
    if (!dur) return 0;
    const hMatch = dur.match(/(\d+)\s*h/i);
    const mMatch = dur.match(/(\d+)\s*m/i);
    return (
      (hMatch ? parseInt(hMatch[1], 10) * 60 : 0) +
      (mMatch ? parseInt(mMatch[1], 10) : 0)
    );
  }

  // ─── Navigation ──────────────────────────────────────
  onModifySearch(): void {
    this.transportService.availableTrips.set([]);
    this.transportService.selectedTrip.set(null);
    this.router.navigate(['/travel']);
  }

  onTripSelected(trip: TravelService) {
    this.transportService.selectedTrip.set(trip);
    this.router.navigate(['/travel/booking']);
  }
}
