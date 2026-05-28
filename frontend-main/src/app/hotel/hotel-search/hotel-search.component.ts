import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HotelService } from '../hotel.service';
import { HotelListingComponent } from '../hotel-listing/hotel-listing.component';
import { Hotel, RoomDetails } from '../model/hotel.model';
import { HotelFilterFormComponent } from '../hotel-filter-form/hotel-filter-form.component';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-hotel-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HotelListingComponent,
    HotelFilterFormComponent,
  ],
  templateUrl: './hotel-search.component.html',
  styleUrls: ['./hotel-search.component.scss'],
})
export class HotelSearchComponent implements OnInit {
  showFilter = false;
  showGuestPicker = false;
  isInitializing = true;
  isSearching = false;

  searchForm!: FormGroup;
  allCities: string[] = [];
  filteredCities: string[] = [];

  today = new Date().toISOString().split('T')[0];
  maxCheckOut = '';

  showResults = false;
  allHotels: Hotel[] = [];
  hotels: Hotel[] = [];
  roomPriceMap: { [hotelId: string]: number } = {};
  destinationError = '';

  savedFilter: {
    maxPrice: number;
    starRating: number | null;
    amenities: string[];
    hotelTypes: string[];
    searchText: string;
  } = {
    maxPrice: 20000,
    starRating: null,
    amenities: [],
    hotelTypes: [],
    searchText: '',
  };

  constructor(
    private fb: FormBuilder,
    private hotelService: HotelService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Try to restore search state from sessionStorage on page reload
    this.hotelService.restoreSearchState();

    this.searchForm = this.fb.group({
      destination: [
        '',
        [Validators.required, Validators.pattern('^[a-zA-Z ]+$')],
      ],
      checkIn: ['', [Validators.required]],
      checkOut: ['', [Validators.required]],
      rooms: [1, [Validators.min(1)]],
      adults: [1, [Validators.min(1)]],
      children: [0],
      infants: [0],
    });

    this.hotelService.getCities().subscribe({
      next: (data) => (this.allCities = data),
    });

    this.route.queryParams.subscribe((params) => {
      const dest = params['destination'] || params['location'] || '';
      const checkIn = params['checkIn'] || '';
      const checkOut = params['checkOut'] || '';

      if (dest || checkIn || checkOut) {
        const resolvedCheckIn = checkIn || this.today;
        const tomorrow = new Date(resolvedCheckIn);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const resolvedCheckOut =
          checkOut || tomorrow.toISOString().split('T')[0];

        this.searchForm.setValue({
          destination: dest,
          checkIn: resolvedCheckIn,
          checkOut: resolvedCheckOut,
          rooms: +params['rooms'] || 1,
          adults: +params['adults'] || 1,
          children: +params['children'] || 0,
          infants: +params['infants'] || 0,
        });

        if (params['hotelName'] && params['filterByName'] !== 'false') {
          this.savedFilter = {
            maxPrice: 20000,
            starRating: null,
            amenities: [],
            hotelTypes: [],
            searchText: params['hotelName'],
          };
        }

        if (dest && resolvedCheckIn && resolvedCheckOut) {
          this.isInitializing = false;
          this.onSearch();
          if (params['hotelName'] && params['filterByName'] !== 'false') {
            setTimeout(
              () =>
                this.applyFilter({
                  maxPrice: 20000,
                  starRating: null,
                  amenities: [],
                  hotelTypes: [],
                  searchText: params['hotelName'],
                }),
              500,
            );
          }
        } else {
          this.isInitializing = false;
        }
      } else if (this.hotelService.hasSearchResults()) {
        const s = this.hotelService.searchState;
        this.searchForm.setValue({
          destination: s.destination,
          checkIn: s.checkIn,
          checkOut: s.checkOut,
          rooms: s.rooms || 1,
          adults: s.adults || 1,
          children: s.children || 0,
          infants: s.infants || 0,
        });
        this.allHotels = s.allHotels;
        this.hotels = s.hotels;
        this.roomPriceMap = s.roomPriceMap;
        this.showResults = true;
        this.savedFilter = { ...s.filter };
        this.isInitializing = false;

        // If roomPriceMap is empty (page reload), reload prices
        if (
          Object.keys(this.roomPriceMap).length === 0 &&
          s.destination &&
          s.checkIn &&
          s.checkOut
        ) {
          this._loadRoomPrices(s.destination, s.checkIn, s.checkOut);
        }

        setTimeout(() => {
          document
            .getElementById('search-form')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      } else {
        this.isInitializing = false;
      }
    });
  }

  // ── Date helpers ──────────────────────────────────────────────

  get minCheckOut(): string {
    const checkIn = this.searchForm.get('checkIn')?.value;
    if (checkIn) {
      const date = new Date(checkIn);
      date.setDate(date.getDate() + 1);
      return date.toISOString().split('T')[0];
    }
    return this.today;
  }

  onCheckInChange(): void {
    const checkIn = this.searchForm.get('checkIn')?.value;
    const checkOut = this.searchForm.get('checkOut')?.value;
    if (checkIn) {
      const max = new Date(checkIn);
      max.setDate(max.getDate() + 9);
      this.maxCheckOut = max.toISOString().split('T')[0];
    }
    if (
      checkIn &&
      checkOut &&
      (checkOut <= checkIn || checkOut > this.maxCheckOut)
    ) {
      this.searchForm.get('checkOut')?.reset();
      // Hide results when checkout date becomes invalid
      this.showResults = false;
      this.hotels = [];
      this.allHotels = [];
      this.roomPriceMap = {};
    }
  }

  onCheckOutChange(): void {
    const checkIn = this.searchForm.get('checkIn')?.value;
    const checkOut = this.searchForm.get('checkOut')?.value;
    if (checkIn && checkOut) {
      const nights =
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        (1000 * 60 * 60 * 24);
      this.searchForm
        .get('checkOut')
        ?.setErrors(nights > 9 ? { maxStay: true } : null);
    }
  }

  // ── Destination helpers ───────────────────────────────────────

  onDestinationInput(event: any): void {
    const input = event.target;
    const sanitized = input.value.replace(/[^a-zA-Z ]/g, '');
    input.value = sanitized;
    this.searchForm
      .get('destination')
      ?.setValue(sanitized, { emitEvent: false });
    this.destinationError = '';
    const trimmed = sanitized.trim();
    this.filteredCities = trimmed
      ? this.allCities.filter((c) =>
          c.toLowerCase().includes(trimmed.toLowerCase()),
        )
      : [];
  }

  selectCity(city: string): void {
    this.searchForm.get('destination')?.setValue(city);
    this.filteredCities = [];
    this.destinationError = '';
  }

  // ── Guest picker ──────────────────────────────────────────────

  toggleGuestPicker(event: Event): void {
    event.stopPropagation();
    this.showGuestPicker = !this.showGuestPicker;
  }

  changeGuest(
    field: 'rooms' | 'adults' | 'children' | 'infants',
    delta: number,
  ): void {
    const v = this.searchForm.value;
    const next = (v[field] || 0) + delta;

    const bounds: Record<string, { min: number; max: number }> = {
      rooms: { min: 1, max: 9 },
      adults: { min: v.rooms, max: 30 },
      children: { min: 0, max: 10 },
      infants: { min: 0, max: 10 },
    };

    if (next < bounds[field].min || next > bounds[field].max) return;
    this.searchForm.patchValue({ [field]: next });

    if (field === 'rooms' && this.searchForm.value.adults < next) {
      this.searchForm.patchValue({ adults: next });
    }

    // Dynamic search when guest details change and results are visible
    if (
      this.showResults &&
      (field === 'rooms' || field === 'adults' || field === 'children')
    ) {
      this.applyRoomCapacityFilter();
    }
  }

  @HostListener('document:click')
  closeGuestPicker(): void {
    this.showGuestPicker = false;
  }

  // ── Search ────────────────────────────────────────────────────

  onSearch(): void {
    if (this.searchForm.invalid) return;

    this.isSearching = true;
    this.destinationError = '';
    this.filteredCities = [];
    this.allHotels = [];
    this.hotels = [];
    this.roomPriceMap = {};
    const { destination, checkIn, checkOut } = this.searchForm.value;

    const isValidCity = this.allCities.some(
      (c) => c.toLowerCase() === destination.toLowerCase(),
    );

    this.hotelService.getHotelsByCity(destination, !isValidCity).subscribe({
      next: (data: Hotel[]) => {
        this.isSearching = false;
        if (data.length === 0 && !isValidCity) {
          this.destinationError = `No hotels found for "${destination}".`;
          this.showResults = false;
          return;
        }
        this.allHotels = data;
        this.hotels = data;
        this.showResults = true;
        // Save state eagerly so going back mid-load still restores the form+results
        this.hotelService.searchState = {
          ...this.hotelService.searchState,
          destination,
          checkIn,
          checkOut,
          rooms: this.searchForm.value.rooms,
          adults: this.searchForm.value.adults,
          children: this.searchForm.value.children,
          infants: this.searchForm.value.infants,
          allHotels: this.allHotels,
          hotels: this.hotels,
          roomPriceMap: this.roomPriceMap,
          showResults: true,
        };
        this.hotelService.saveSearchState(); // Persist to sessionStorage
        this._loadRoomPrices(destination, checkIn, checkOut);
      },
    });
  }

  // ── Room prices + capacity filter ─────────────────────────────

  private _loadRoomPrices(
    destination: string,
    checkIn: string,
    checkOut: string,
  ): void {
    const { rooms, adults, children } = this.searchForm.value;
    this.roomPriceMap = {};

    // If no hotels, nothing to do
    if (this.allHotels.length === 0) {
      console.log('No hotels to check availability for');
      return;
    }

    console.log(
      `Checking availability for ${this.allHotels.length} hotels from ${checkIn} to ${checkOut}`,
    );

    // Fetch available rooms for each hotel based on selected dates
    const availabilityChecks = this.allHotels.map((hotel) =>
      this.hotelService.getAvailableRooms(hotel._id, checkIn, checkOut).pipe(
        map((availableRooms) => {
          console.log(
            `Hotel ${hotel.name}: ${availableRooms.length} available rooms`,
          );
          return { hotelId: hotel._id, rooms: availableRooms };
        }),
      ),
    );

    forkJoin(availabilityChecks).subscribe({
      next: (results) => {
        console.log('Availability results:', results);

        // Flatten all available rooms from all hotels
        const allAvailableRooms: RoomDetails[] = results.flatMap(
          (r) => r.rooms,
        );
        console.log(
          `Total available rooms across all hotels: ${allAvailableRooms.length}`,
        );

        // Build price map using only available rooms
        allAvailableRooms.forEach((room) => {
          const hotel = this.allHotels.find((h) => h._id === room.hotelId);
          const multiplier = hotel?.seasonalMultiplier ?? 1;
          const effectivePrice = room.basePricePerNight * multiplier;
          const existing = this.roomPriceMap[room.hotelId];
          if (!existing || effectivePrice < existing) {
            this.roomPriceMap[room.hotelId] = effectivePrice;
          }
        });

        // Capacity filter — only consider hotels with available rooms
        const fittableIds = this._getFittableHotelIds(
          allAvailableRooms,
          rooms,
          adults,
          children,
        );
        console.log(
          `Hotels that fit capacity requirements: ${fittableIds.size}`,
        );

        this.allHotels = this.allHotels.filter((h) => fittableIds.has(h._id));
        this.hotels = this.hotels.filter((h) => fittableIds.has(h._id));
        console.log(`Final filtered hotels: ${this.hotels.length}`);

        // Persist state
        this.hotelService.searchState = {
          ...this.hotelService.searchState,
          destination,
          checkIn,
          checkOut,
          rooms,
          adults,
          children,
          infants: this.searchForm.value.infants,
          allHotels: this.allHotels,
          hotels: this.hotels,
          roomPriceMap: this.roomPriceMap,
          showResults: true,
        };
        this.hotelService.saveSearchState();
      },
      error: (err) => {
        console.error('Error checking room availability:', err);
      },
    });
  }

  /**
   * Returns the set of hotelIds that can physically accommodate the request.
   *
   * Logic: a hotel PASSES if it has at least one room category where:
   *   - each room of that category fits ceil((adults + children) / rooms) people
   *   - there are at least `rooms` available rooms of that category
   *
   * Uses only `maxOccupancy` today. When `maxAdults` / `maxChildren` are added
   * to RoomDetails later, just add a second condition here — nothing else changes.
   */
  private _getFittableHotelIds(
    allRooms: RoomDetails[],
    roomsNeeded: number,
    adults: number,
    children: number,
  ): Set<string> {
    // Infants don't count toward occupancy (industry standard)
    const totalPeople = adults + children;
    const peoplePerRoom = Math.ceil(totalPeople / roomsNeeded);

    console.log(
      `Capacity filter: Need ${roomsNeeded} rooms for ${totalPeople} people (${peoplePerRoom} per room)`,
    );

    // Group available rooms by hotelId + type
    const groups = new Map<
      string,
      { hotelId: string; count: number; maxOccupancy: number }
    >();

    for (const room of allRooms) {
      // Don't filter by status here - backend already returned only available rooms
      const key = `${room.hotelId}__${room.type}`;
      const existing = groups.get(key);
      if (existing) {
        existing.count++;
      } else {
        groups.set(key, {
          hotelId: room.hotelId,
          count: 1,
          maxOccupancy: room.maxOccupancy,
        });
      }
    }

    console.log(
      'Room groups by hotel and type:',
      Array.from(groups.entries()).map(([key, val]) => ({ key, ...val })),
    );

    const fittable = new Set<string>();
    for (const { hotelId, count, maxOccupancy } of groups.values()) {
      // Room category passes if: each room is big enough AND enough rooms exist
      const fits = maxOccupancy >= peoplePerRoom && count >= roomsNeeded;
      console.log(
        `Hotel ${hotelId}: ${count} rooms, occupancy ${maxOccupancy}, fits=${fits}`,
      );
      if (fits) {
        fittable.add(hotelId);
      }
    }
    return fittable;
  }

  // ── Filter ────────────────────────────────────────────────────

  applyFilter(filter: any): void {
    const { destination, rooms, adults, children } = this.searchForm.value;
    const isValidCity = this.allCities.some(
      (c) => c.toLowerCase() === destination.toLowerCase(),
    );
    this.hotelService
      .searchHotels({
        city: destination,
        useSearch: !isValidCity,
        starRating: filter.starRating,
        amenities: filter.amenities,
        hotelTypes: filter.hotelTypes,
        name: filter.searchText,
      })
      .subscribe({
        next: (hotels: Hotel[]) => {
          // Apply client-side price filter
          let filtered = hotels.filter((hotel) => {
            const price = this.roomPriceMap[hotel._id] || 0;
            return !price || price <= filter.maxPrice;
          });

          // Re-apply room capacity filter
          this.hotelService.getAllRooms().subscribe({
            next: (allRooms: RoomDetails[]) => {
              const fittableIds = this._getFittableHotelIds(
                allRooms,
                rooms,
                adults,
                children,
              );
              this.hotels = filtered.filter((h) => fittableIds.has(h._id));
              this.hotelService.searchState.hotels = this.hotels;
              this.hotelService.searchState.filter = { ...filter };
              this.savedFilter = { ...filter };
            },
          });
        },
      });
  }

  applyRoomCapacityFilter(): void {
    const { rooms, adults, children } = this.searchForm.value;
    this.hotelService.getAllRooms().subscribe({
      next: (allRooms: RoomDetails[]) => {
        const fittableIds = this._getFittableHotelIds(
          allRooms,
          rooms,
          adults,
          children,
        );
        this.hotels = this.allHotels.filter((h) => fittableIds.has(h._id));
        this.hotelService.searchState.hotels = this.hotels;
        this.hotelService.searchState.rooms = rooms;
        this.hotelService.searchState.adults = adults;
        this.hotelService.searchState.children = children;
      },
    });
  }
}
