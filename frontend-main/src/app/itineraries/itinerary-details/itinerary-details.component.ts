import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ItineraryService } from '../itinerary.service';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-itinerary-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './itinerary-details.component.html',
  styleUrl: './itinerary-details.component.scss',
})
export class ItineraryDetailsComponent implements OnInit {
  showAddForm = false;
  isEditingTrip = false;
  showDeleteModal = false;
  showSyncPanel = false;
  syncLoading = false;
  syncTravelBookings: any[] = [];
  syncHotelBookings: any[] = [];
  selectedRefs = new Set<string>();
  alreadySyncedRefs = new Set<string>();
  pendingDeleteId: string | null = null;
  items: any[] = [];
  currentTrip: any = null;
  itemForm!: FormGroup;
  editForm!: FormGroup;
  selectedActivityId: string | null = null;

  today = new Date().toISOString().split('T')[0];
  tripMinDate: string = this.today;
  tripMaxDate: string = '';
  authService = inject(AuthService);

  private get CURRENT_USER_ID(): string {
    return this.authService.getCurrentUser()?._id ?? 'usr_001';
  }

  private fb = inject(FormBuilder);
  private itineraryService = inject(ItineraryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.initForm();
    const tripId = this.route.snapshot.paramMap.get('id');
    if (tripId) this.loadData(tripId);
  }

  loadData(tripId: string): void {
    this.itineraryService.getItineraries().subscribe((trips: any[]) => {
      this.currentTrip = trips.find(
        (t) => String(t._id ?? t.id) === String(tripId),
      );

      if (this.currentTrip) {
        const tripStart = this.currentTrip.start_date;
        const tripEnd = this.currentTrip.end_date;
        this.tripMinDate = tripStart > this.today ? tripStart : this.today;
        this.tripMaxDate = tripEnd;
      }
    });

    this.loadItems(tripId);
  }

  loadItems(tripId: string): void {
    this.itineraryService
      .getItemsForTrip(tripId, this.currentTrip?.type)
      .subscribe({
        next: (items) => (this.items = items),
      });
  }

  initForm(): void {
    this.itemForm = this.fb.group({
      category: ['travel', Validators.required],
    });
    this.buildCategoryFields('travel');

    this.itemForm.get('category')!.valueChanges.subscribe((cat) => {
      this.buildCategoryFields(cat);
    });

    this.editForm = this.fb.group({
      trip_name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(60),
        ],
      ],
      destination: ['', Validators.maxLength(80)],
      image_url: ['', Validators.pattern(/^(https?:\/\/.*)?$/)],
    });
  }

  minDateValidator() {
    return (control: import('@angular/forms').AbstractControl) => {
      if (!control.value) return null;
      const selected = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected < today ? { pastDate: true } : null;
    };
  }

  checkOutAfterCheckIn() {
    return (control: import('@angular/forms').AbstractControl) => {
      if (!control.value) return null;
      const checkIn = this.itemForm?.get('checkIn')?.value;
      if (!checkIn) return null;
      return new Date(control.value) <= new Date(checkIn)
        ? { checkOutBeforeCheckIn: true }
        : null;
    };
  }

  private categoryFields: string[] = [];

  buildCategoryFields(cat: string): void {
    // Clear previous fields
    this.categoryFields.forEach((f) => this.itemForm.removeControl(f));

    if (cat === 'travel') {
      this.categoryFields = [
        'transport',
        'from',
        'to',
        'date',
        'depTime',
        'operator',
        'notes',
      ];
      this.itemForm.addControl(
        'transport',
        this.fb.control('flight', Validators.required),
      );
      this.itemForm.addControl(
        'from',
        this.fb.control('', [Validators.required, Validators.maxLength(80)]),
      );
      this.itemForm.addControl(
        'to',
        this.fb.control('', [Validators.required, Validators.maxLength(80)]),
      );
      this.itemForm.addControl(
        'date',
        this.fb.control('', [Validators.required, this.minDateValidator()]),
      );
      this.itemForm.addControl('depTime', this.fb.control(''));
      this.itemForm.addControl(
        'operator',
        this.fb.control('', Validators.maxLength(60)),
      );
      this.itemForm.addControl(
        'notes',
        this.fb.control('', Validators.maxLength(200)),
      );
    } else if (cat === 'hotel') {
      this.categoryFields = [
        'hotelName',
        'city',
        'checkIn',
        'checkOut',
        'roomType',
        'notes',
      ];
      this.itemForm.addControl(
        'hotelName',
        this.fb.control('', [Validators.required, Validators.maxLength(100)]),
      );
      this.itemForm.addControl(
        'city',
        this.fb.control('', [Validators.required, Validators.maxLength(80)]),
      );
      this.itemForm.addControl(
        'checkIn',
        this.fb.control('', [Validators.required, this.minDateValidator()]),
      );
      this.itemForm.addControl(
        'checkOut',
        this.fb.control('', [Validators.required]),
      );
      this.itemForm.addControl(
        'roomType',
        this.fb.control('', Validators.maxLength(60)),
      );
      this.itemForm.addControl(
        'notes',
        this.fb.control('', Validators.maxLength(200)),
      );

      // Revalidate checkout when checkin changes
      this.itemForm.get('checkIn')!.valueChanges.subscribe(() => {
        this.itemForm.get('checkOut')!.updateValueAndValidity();
      });
      this.itemForm.get('checkOut')!.addValidators(this.checkOutAfterCheckIn());
    } else {
      // activity
      this.categoryFields = ['activityName', 'location', 'date', 'notes'];
      this.itemForm.addControl(
        'activityName',
        this.fb.control('', [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ]),
      );
      this.itemForm.addControl(
        'location',
        this.fb.control('', [Validators.required, Validators.maxLength(80)]),
      );
      this.itemForm.addControl(
        'date',
        this.fb.control('', [Validators.required, this.minDateValidator()]),
      );
      this.itemForm.addControl(
        'notes',
        this.fb.control('', Validators.maxLength(200)),
      );
    }
  }

  get currentCategory(): string {
    return this.itemForm.get('category')?.value ?? 'travel';
  }

  openEditTrip(): void {
    this.editForm.patchValue({
      trip_name: this.currentTrip?.trip_name ?? '',
      destination: this.currentTrip?.destination ?? '',
      image_url:
        this.currentTrip?.image_url ?? this.currentTrip?.images?.[0] ?? '',
    });
    this.isEditingTrip = true;
  }

  cancelEditTrip(): void {
    this.isEditingTrip = false;
  }

  saveEditTrip(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const tripId = this.route.snapshot.paramMap.get('id')!;
    const { trip_name, destination, image_url } = this.editForm.value;
    this.itineraryService
      .patchTrip(tripId, { trip_name, destination, image_url })
      .subscribe({
        next: (updated) => {
          this.currentTrip.trip_name = updated.trip_name ?? trip_name;
          this.currentTrip.destination =
            updated.destination ?? destination ?? null;
          // Backend returns images array — sync both fields
          this.currentTrip.images =
            updated.images ?? (image_url ? [image_url] : []);
          this.currentTrip.image_url = this.currentTrip.images[0] ?? null;
          this.isEditingTrip = false;
        },
        error: () => console.error('Failed to update trip'),
      });
  }

  deleteTrip(): void {
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    const tripId = this.route.snapshot.paramMap.get('id')!;
    this.itineraryService.deleteItinerary(tripId).subscribe({
      next: () => this.router.navigate(['/itinerary']),
      error: () => console.error('Failed to delete trip'),
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
  }

  toggleForm(): void {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) this.isEditingTrip = false;
  }

  toggleActivity(item: any): void {
    if (item.category !== 'hotel' || item.source_booking_ref) return;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const checkIn = item.date || fmt(today);
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkInDate.getDate() + 1);

    this.router.navigate(['/hotel'], {
      queryParams: {
        destination: item.location,
        checkIn: checkIn,
        checkOut: fmt(checkOutDate),
        hotelName: item.title,
        filterByName: false,
      },
    });
  }

  // Expands/collapses recommendations below the clicked card
  // toggleActivity(itemId: string): void {
  //   this.selectedActivityId = this.selectedActivityId === itemId ? null : itemId;
  // }

  buildItemPayload(): any {
    const v = this.itemForm.value;
    const cat = v.category;
    if (cat === 'travel') {
      const transportLabel: Record<string, string> = {
        flight: 'Flight',
        train: 'Train',
        bus: 'Bus',
      };
      const label = transportLabel[v.transport] ?? v.transport;
      const title = v.from && v.to ? `${label} — ${v.from} to ${v.to}` : label;
      const notesParts: string[] = [];
      if (v.depTime) notesParts.push(`Departure: ${v.depTime}`);
      if (v.operator) notesParts.push(`Operator: ${v.operator}`);
      if (v.notes) notesParts.push(v.notes);
      return {
        category: cat,
        title,
        location: v.from,
        date: v.date,
        notes: notesParts.join(' · '),
        status: 'confirmed',
      };
    } else if (cat === 'hotel') {
      const notesParts: string[] = [];
      if (v.checkOut) notesParts.push(`Check-out: ${v.checkOut}`);
      if (v.roomType) notesParts.push(`Room: ${v.roomType}`);
      if (v.notes) notesParts.push(v.notes);
      return {
        category: cat,
        title: v.hotelName,
        location: v.city,
        date: v.checkIn,
        notes: notesParts.join(' · '),
        status: 'confirmed',
      };
    } else {
      return {
        category: cat,
        title: v.activityName,
        location: v.location,
        date: v.date,
        notes: v.notes ?? '',
        status: 'confirmed',
      };
    }
  }

  onSubmit(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }
    const tripId = this.route.snapshot.paramMap.get('id')!;
    const payload = this.buildItemPayload();
    this.itineraryService.addItem(tripId, payload).subscribe({
      next: () => {
        this.itemForm.patchValue({ category: 'travel' });
        this.buildCategoryFields('travel');
        this.showAddForm = false;
        this.itineraryService
          .getItemsForTrip(tripId, this.currentTrip?.type)
          .subscribe((items) => {
            this.items = items;
            this.itineraryService
              .updateItineraryDates(tripId, items)
              .subscribe((updated) => {
                if (this.currentTrip) {
                  this.currentTrip.start_date = updated.start_date;
                  this.currentTrip.end_date = updated.end_date;
                }
              });
          });
      },
      error: () => console.error('Failed to save activity.'),
    });
  }

  requestDeleteItem(item: any): void {
    this.pendingDeleteId = item._id ?? item.id;
  }

  confirmDeleteItem(item: any): void {
    this.pendingDeleteId = null;
    this.onDeleteItem(item);
  }

  onDeleteItem(item: any): void {
    const tripId = this.route.snapshot.paramMap.get('id')!;
    this.itineraryService.deleteItem(item._id ?? item.id).subscribe({
      next: () => {
        this.itineraryService
          .getItemsForTrip(tripId, this.currentTrip?.type)
          .subscribe((items) => {
            this.items = items;
            this.itineraryService
              .updateItineraryDates(tripId, items)
              .subscribe((updated) => {
                if (this.currentTrip) {
                  this.currentTrip.start_date = updated.start_date;
                  this.currentTrip.end_date = updated.end_date;
                }
              });
          });
      },
      error: (err) => console.error('Delete failed:', err),
    });
  }

  openSyncPanel(): void {
    this.showSyncPanel = true;
    this.syncLoading = true;
    this.selectedRefs = new Set();
    const tripId = this.route.snapshot.paramMap.get('id')!;
    const userId = this.CURRENT_USER_ID;

    forkJoin({
      existingItems: this.itineraryService.getItemsForTrip(
        tripId,
        this.currentTrip?.type,
      ),
      travel: this.itineraryService.getTravelBookingsByUser(userId),
      hotel: this.itineraryService.getHotelBookingsByUser(userId),
    }).subscribe({
      next: ({ existingItems, travel, hotel }) => {
        // Filter out cancelled bookings
        const activeTravelBookings = (travel || []).filter(
          (b) =>
            b.bookingStatus !== 'cancelled' && b.paymentStatus !== 'cancelled',
        );
        const activeHotelBookings = (hotel || []).filter(
          (b) =>
            b.bookingStatus !== 'cancelled' && b.paymentStatus !== 'cancelled',
        );

        // Find and remove cancelled synced items
        const activeRefs = new Set([
          ...activeTravelBookings.map((b) => b.bookingReference),
          ...activeHotelBookings.map((b) => b.bookingReference),
        ]);
        const itemsToRemove = existingItems.filter(
          (i) => i.source_booking_ref && !activeRefs.has(i.source_booking_ref),
        );

        // Remove cancelled synced items from database
        if (itemsToRemove.length > 0) {
          forkJoin(
            itemsToRemove.map((item) =>
              this.itineraryService.deleteItem(item._id ?? item.id),
            ),
          ).subscribe({
            next: () => {
              // Reload items after deletion
              this.loadItems(tripId);
            },
            error: (err) =>
              console.error('Failed to remove cancelled items:', err),
          });
        }

        this.alreadySyncedRefs = new Set(
          existingItems
            .filter(
              (i) =>
                i.source_booking_ref && activeRefs.has(i.source_booking_ref),
            )
            .map((i) => i.source_booking_ref),
        );

        this.syncTravelBookings = activeTravelBookings;
        this.syncHotelBookings = activeHotelBookings;
        this.syncLoading = false;
      },
      error: () => {
        this.syncLoading = false;
      },
    });
  }

  closeSyncPanel(): void {
    this.showSyncPanel = false;
    this.selectedRefs = new Set();
  }

  toggleSelection(ref: string): void {
    if (this.alreadySyncedRefs.has(ref)) return;
    if (this.selectedRefs.has(ref)) {
      this.selectedRefs.delete(ref);
    } else {
      this.selectedRefs.add(ref);
    }
  }

  get selectedCount(): number {
    return this.selectedRefs.size;
  }

  addSelectedBookings(): void {
    const tripId = this.route.snapshot.paramMap.get('id')!;
    const itemsToAdd: any[] = [];

    this.syncTravelBookings.forEach((booking) => {
      if (!this.selectedRefs.has(booking.bookingReference)) return;
      const snap = booking.serviceSnapshot;
      const bookingDate = snap.departureTime.split('T')[0];
      itemsToAdd.push({
        itinerary_id: tripId,
        category: 'travel',
        title: `${snap.operatorName} ${snap.serviceNumber} — ${snap.from} to ${snap.to}`,
        location: snap.from,
        date: bookingDate,
        notes: `Cabin: ${snap.cabinClass}. Ref: ${booking.bookingReference}`,
        status: 'confirmed',
        source_booking_ref: booking.bookingReference,
      });
    });

    this.syncHotelBookings.forEach((booking) => {
      if (!this.selectedRefs.has(booking.bookingReference)) return;
      const checkInDate = (booking.checkIn ?? '').split('T')[0];
      itemsToAdd.push({
        itinerary_id: tripId,
        category: 'hotel',
        title: `Hotel Check-in — ${booking.roomType ?? booking.hotelName ?? 'Room'}`,
        location: booking.hotelName ?? booking.hotelId,
        date: checkInDate,
        notes: `${booking.numNights} nights. Ref: ${booking.bookingReference}`,
        status: 'confirmed',
        source_booking_ref: booking.bookingReference,
      });
    });

    if (itemsToAdd.length === 0) {
      this.closeSyncPanel();
      return;
    }

    const postNext = (index: number) => {
      if (index >= itemsToAdd.length) {
        this.closeSyncPanel();
        this.itineraryService
          .getItemsForTrip(tripId, this.currentTrip?.type)
          .subscribe((items) => {
            this.items = items;
            this.itineraryService
              .updateItineraryDates(tripId, items)
              .subscribe((updated) => {
                if (this.currentTrip) {
                  this.currentTrip.start_date = updated.start_date;
                  this.currentTrip.end_date = updated.end_date;
                }
              });
          });
        return;
      }
      this.itineraryService.addItem(tripId, itemsToAdd[index]).subscribe({
        next: () => postNext(index + 1),
        error: () => postNext(index + 1),
      });
    };
    postNext(0);
  }

  downloadItinerary(): void {
    const trip = this.currentTrip;
    const lines: string[] = [];
    lines.push(`ITINERARY: ${trip?.trip_name ?? 'My Trip'}`);
    if (trip?.destination) lines.push(`Destination: ${trip.destination}`);
    if (trip?.start_date && trip?.end_date)
      lines.push(`Dates: ${trip.start_date} – ${trip.end_date}`);
    lines.push('');
    lines.push('ACTIVITIES');
    lines.push('----------');
    if (this.items.length === 0) {
      lines.push('No activities added yet.');
    } else {
      this.items.forEach((item, idx) => {
        lines.push(
          `${idx + 1}. [${(item.category ?? '').toUpperCase()}] ${item.title}`,
        );
        if (item.date) lines.push(`   Date: ${item.date}`);
        if (item.location) lines.push(`   Location: ${item.location}`);
        if (item.notes) lines.push(`   Notes: ${item.notes}`);
        lines.push('');
      });
    }
    const blob = new Blob([lines.join('\n')], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(trip?.trip_name ?? 'itinerary').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  exportToCalendar(): void {
    this.itineraryService.exportToCalendar(
      this.items,
      this.currentTrip?.trip_name,
    );
  }

  getIcon(category: string): string {
    switch (category) {
      case 'travel':
        return 'bi bi-airplane-engines';
      case 'hotel':
        return 'bi bi-building';
      case 'activity':
        return 'bi bi-camera';
      default:
        return 'bi bi-pin-map';
    }
  }

  /** Split the composed notes string into individual chip labels */
  notesChips(notes: string): string[] {
    if (!notes) return [];
    return notes
      .split(' · ')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /** For travel: extract "From → To" from title "Flight — Delhi to Mumbai" */
  travelRoute(item: any): { from: string; to: string } | null {
    const title: string = item.title ?? '';
    const dashIdx = title.indexOf(' \u2014 ');
    if (dashIdx === -1) return null;
    const route = title.slice(dashIdx + 3).trim();
    const toIdx = route.toLowerCase().indexOf(' to ');
    if (toIdx === -1) return null;
    return {
      from: route.slice(0, toIdx).trim(),
      to: route.slice(toIdx + 4).trim(),
    };
  }

  /** For travel: extract the mode label before the dash */
  travelMode(item: any): string {
    const title: string = item.title ?? '';
    const dashIdx = title.indexOf(' \u2014 ');
    return dashIdx !== -1 ? title.slice(0, dashIdx).trim() : title;
  }

  /** For hotel: find value of a named chip e.g. "Check-out: 2026-05-20" */
  hotelChipValue(notes: string, key: string): string {
    const chip = this.notesChips(notes).find((c) =>
      c.toLowerCase().startsWith(key.toLowerCase() + ':'),
    );
    return chip ? chip.slice(key.length + 1).trim() : '';
  }

  /** For hotel: chips that are NOT check-out or room type (true user notes) */
  hotelExtraChips(notes: string): string[] {
    return this.notesChips(notes).filter(
      (c) =>
        !c.toLowerCase().startsWith('check-out:') &&
        !c.toLowerCase().startsWith('room:'),
    );
  }
}
