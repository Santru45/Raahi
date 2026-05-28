import { Component, inject, OnInit } from '@angular/core';
import { TransportService } from '../../travel.service';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TravelDAO } from '../../travel.dao';
import { TravelLocation } from '../../travel.model';
import { Router } from '@angular/router';
@Component({
  selector: 'app-travel-search',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './travel-search.component.html',
  styleUrl: './travel-search.component.scss',
})
export class TravelSearchComponent implements OnInit {
  ngOnInit(): void {
    // Restore search results from sessionStorage if page reloaded
    this.transportService.restoreSearchResults();

    const origin = this.transportService.searchOrigin();
    const destination = this.transportService.searchDestination();

    if (origin || destination) {
      const mode = this.transportService.selectedMode();
      this.searchForm.patchValue({
        origin: origin,
        destination: destination,
        date: this.transportService.searchDate(),
        passengers: this.transportService.passengerCount(),
      });

      const cabinClass = this.transportService.searchCabinClass();
      if (mode === 'flight') {
        this.searchForm.patchValue({ cabinClass });
      } else if (mode === 'train') {
        this.searchForm.patchValue({ travelClass: cabinClass });
      } else if (mode === 'bus') {
        this.searchForm.patchValue({ busType: cabinClass });
      }
    }
  }

  public transportService = inject(TransportService);
  private fb = inject(FormBuilder);
  private travelDao = inject(TravelDAO);
  private router = inject(Router);
  today: string = new Date().toISOString().split('T')[0];
  //Suggestions Arrays
  originSuggestions: TravelLocation[] = [];
  destSuggestions: TravelLocation[] = [];

  searchForm: FormGroup = this.fb.group({
    origin: ['', Validators.required],
    destination: ['', Validators.required],
    date: [
      new Date().toISOString().split('T')[0],
      [Validators.required, this.minDateValidator()],
    ],
    passengers: [
      1,
      [Validators.required, Validators.min(1), Validators.max(9)],
    ],

    cabinClass: [''],
    travelClass: [''],
    quota: [''],
    busType: [''],
  });

  selectMode(mode: 'flight' | 'train' | 'bus'): void {
    this.transportService.selectedMode.set(mode);
    this.transportService.selectedTrip.set(null);
    this.transportService.availableTrips.set([]);

    this.searchForm.reset({
      origin: '',
      destination: '',
      date: new Date().toISOString().split('T')[0],
      passengers: 1,
      cabinClass: '',
      travelClass: '',
      quota: '',
      busType: '',
    });

    this.originSuggestions = [];
    this.destSuggestions = [];
  }

  onOriginInput(event: Event) {
    const query = (event.target as HTMLInputElement).value;

    if (query.length < 2) {
      this.originSuggestions = [];
      return;
    }

    const mode = this.transportService.selectedMode();
    this.travelDao.searchLocations(mode, query).subscribe({
      next: (results) => {
        this.originSuggestions = results;
      },
      error: () => {
        this.originSuggestions = [];
      },
    });
  }

  onDestInput(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    if (query.length < 2) {
      this.destSuggestions = [];
      return;
    }

    const mode = this.transportService.selectedMode();
    this.travelDao.searchLocations(mode, query).subscribe({
      next: (results) => {
        this.destSuggestions = results;
      },
      error: () => {
        this.destSuggestions = [];
      },
    });
  }

  selectOrigin(loc: TravelLocation) {
    this.searchForm.get('origin')?.setValue(loc.city);
    this.originSuggestions = [];
  }

  selectDest(loc: TravelLocation) {
    this.searchForm.get('destination')?.setValue(loc.city);
    this.destSuggestions = [];
  }

  incrementPassengers(): void {
    const current = this.searchForm.get('passengers')?.value;
    if (current < 9) {
      this.searchForm.patchValue({ passengers: current + 1 });
    }
  }

  decrementPassengers(): void {
    const current = this.searchForm.get('passengers')?.value;
    if (current > 1) {
      this.searchForm.patchValue({ passengers: current - 1 });
    }
  }

  sameRouteError = false;

  minDateValidator() {
    return (control: import('@angular/forms').AbstractControl) => {
      if (!control.value) return null;
      const selected = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected < today ? { pastDate: true } : null;
    };
  }

  onSearch() {
    this.sameRouteError = false;
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const mode = this.transportService.selectedMode();
    const origin = this.searchForm.get('origin')?.value?.trim();
    const destination = this.searchForm.get('destination')?.value?.trim();

    if (
      origin &&
      destination &&
      origin.toLowerCase() === destination.toLowerCase()
    ) {
      this.sameRouteError = true;
      return;
    }

    let cabinClass = '';
    if (mode === 'flight') {
      cabinClass = this.searchForm.get('cabinClass')?.value || '';
    } else if (mode === 'train') {
      cabinClass = this.searchForm.get('travelClass')?.value || '';
    } else if (mode === 'bus') {
      cabinClass = this.searchForm.get('busType')?.value || '';
    }

    this.transportService.searchOrigin.set(origin);
    this.transportService.searchDestination.set(destination);
    this.transportService.searchDate.set(this.searchForm.get('date')?.value);
    this.transportService.searchCabinClass.set(cabinClass);

    const selectedDate = this.searchForm.get('date')?.value || '';
    console.log('Searching:', {
      mode,
      origin,
      destination,
      cabinClass,
      date: selectedDate,
    });

    this.travelDao
      .getServices(mode, origin, destination, cabinClass, selectedDate)
      .subscribe({
        next: (results) => {
          console.log('Raw results:', results);

          const now = new Date();
          const upcomingResults = results.filter((trip) => {
            const departure = new Date(trip.schedule.departureTime);
            return departure > now;
          });

          console.log('Filtered results:', upcomingResults);

          // Only set ONCE — filtered results only
          this.transportService.availableTrips.set(upcomingResults);
          this.transportService.passengerCount.set(
            Number(this.searchForm.get('passengers')?.value),
          );
          this.transportService.saveSearchResults(); // Persist search results
          this.router.navigate(['/travel/results']);
        },
        error: (err) => {
          console.log('Search Failed', err);
        },
      });
  }
}
