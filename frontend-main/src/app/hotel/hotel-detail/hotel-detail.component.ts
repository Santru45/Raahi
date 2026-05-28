import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HotelService } from '../hotel.service';
import { Hotel, RoomDetails, RatePlan } from '../model/hotel.model';
import { FormsModule } from '@angular/forms';
import { ReviewPageComponent } from '../Review/review-page/review-page.component';

export interface RoomTypeGroup {
  type: string;
  bedType: string;
  maxOccupancy: number;
  basePricePerNight: number;
  amenities: string[];
  images: string[];
  availableRooms: RoomDetails[];
  availableCount: number;
}

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReviewPageComponent],
  templateUrl: './hotel-detail.component.html',
  styleUrls: ['./hotel-detail.component.scss'],
})
export class HotelDetailComponent implements OnInit {
  hotels: Hotel | null = null;
  selectedType: RoomTypeGroup | null = null;
  selectedQuantity = 1;
  selectedPlan: RatePlan | null = null;
  loading = true;
  checkingAvailability = false;
  entityId = '';
  hotelId = '';

  // Pre-filled from search query params
  requestedRooms = 1;
  guests = 1;
  children = 0;
  infants = 0;

  checkIn = '';
  checkOut = '';
  today = new Date().toISOString().split('T')[0];
  maxCheckOut = '';
  checkOutError = false;

  baseAmount = 0;
  taxAmount = 0;
  totalAmount = 0;

  rooms: RoomDetails[] = [];
  roomTypeGroups: RoomTypeGroup[] = [];
  ratePlans: RatePlan[] = [];

  activeGroupImageIndex: { [type: string]: number } = {};

  couponCode = '';
  couponDiscountPercent = 0;
  couponOfferId = '';
  couponMinNights = 0;
  hasCoupon = false;

  route = inject(ActivatedRoute);
  router = inject(Router);
  private hotelService = inject(HotelService);

  ngOnInit(): void {
    // Restore coupon from bookingState first (set when navigating back from summary)
    const bookingState = this.hotelService.getBookingState();
    if (bookingState?.couponCode) {
      this.couponCode = bookingState.couponCode;
      this.couponDiscountPercent = bookingState.couponDiscountPercent || 0;
      this.couponOfferId = bookingState.couponOfferId || '';
      this.couponMinNights = bookingState.couponMinNights || 0;
      this.hasCoupon = true;
    } else {
      // Fallback: coupon passed via history.state from search/offer page
      const state = history.state;
      if (state?.couponCode) {
        this.couponCode = state.couponCode;
        this.couponDiscountPercent = state.discountPercent || 0;
        this.couponOfferId = state.offerId || '';
        this.couponMinNights = state.minNights || 0;
        this.hasCoupon = true;
      }
    }

    // Read all search context from query params
    this.route.queryParams.subscribe((params) => {
      this.checkIn = params['checkIn'] || '';
      this.checkOut = params['checkOut'] || '';
      this.requestedRooms = +params['rooms'] || 1;
      this.guests = +params['adults'] || 1;
      this.children = +params['children'] || 0;
      this.infants = +params['infants'] || 0;

      // Pre-fill quantity from searched rooms
      this.selectedQuantity = this.requestedRooms;
    });

    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.hotelId = id;
        this.hotelService.getHotelWithRoomsAndPlans(id).subscribe({
          next: (data) => {
            this.hotels = data.hotel;
            this.rooms = data.rooms;
            this.ratePlans = data.ratePlans;
            this.loading = false;
            this.entityId = this.hotels?._id ?? '';
            // If dates already set (from query params), fetch date-based availability
            if (this.checkIn && this.checkOut) {
              this.refreshAvailability().then(() =>
                this.restoreSelectionFromState(),
              );
            } else {
              this.buildRoomTypeGroups();
              this.restoreSelectionFromState();
            }
          },
          error: (err) => console.error(err),
        });
      }
    });
  }

  // ── Room grouping ─────────────────────────────────────────────

  private buildRoomTypeGroups(): void {
    const groupMap = new Map<string, RoomTypeGroup>();

    for (const room of this.rooms) {
      const key = room.type;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          type: room.type,
          bedType: room.bedType,
          maxOccupancy: room.maxOccupancy,
          basePricePerNight: room.basePricePerNight,
          amenities: room.amenities || [],
          images: room.images || [],
          availableRooms: [],
          availableCount: 0,
        });
      }
      const group = groupMap.get(key)!;
      // Keep the lowest base price within the type group
      if (room.basePricePerNight < group.basePricePerNight) {
        group.basePricePerNight = room.basePricePerNight;
      }
      if (room.status === 'available') {
        group.availableRooms.push(room);
        group.availableCount++;
      }
    }

    this.roomTypeGroups = Array.from(groupMap.values());
  }

  // Fetch rooms available for the selected date range from backend
  refreshAvailability(): Promise<void> {
    if (!this.hotelId || !this.checkIn || !this.checkOut) {
      this.buildRoomTypeGroups();
      return Promise.resolve();
    }
    this.checkingAvailability = true;
    return new Promise<void>((resolve) => {
      this.hotelService
        .getAvailableRooms(this.hotelId, this.checkIn, this.checkOut)
        .subscribe({
          next: (availableRooms) => {
            // Build groups from only the rooms available for these dates
            const groupMap = new Map<string, RoomTypeGroup>();
            // First pass: create groups from ALL hotel rooms (for structure/images)
            for (const room of this.rooms) {
              const key = room.type;
              if (!groupMap.has(key)) {
                groupMap.set(key, {
                  type: room.type,
                  bedType: room.bedType,
                  maxOccupancy: room.maxOccupancy,
                  basePricePerNight: room.basePricePerNight,
                  amenities: room.amenities || [],
                  images: room.images || [],
                  availableRooms: [],
                  availableCount: 0,
                });
              }
              const group = groupMap.get(key)!;
              if (room.basePricePerNight < group.basePricePerNight) {
                group.basePricePerNight = room.basePricePerNight;
              }
            }
            // Second pass: count only rooms available for the date range
            const availableIds = new Set(availableRooms.map((r) => r._id));
            for (const room of this.rooms) {
              if (availableIds.has(room._id)) {
                const group = groupMap.get(room.type)!;
                group.availableRooms.push(room);
                group.availableCount++;
              }
            }
            this.roomTypeGroups = Array.from(groupMap.values());
            // Reset selection if the selected type is no longer available
            if (this.selectedType) {
              const updated = this.roomTypeGroups.find(
                (g) =>
                  g.type === this.selectedType!.type &&
                  g.bedType === this.selectedType!.bedType,
              );
              if (!updated || updated.availableCount === 0) {
                this.selectedType = null;
                this.selectedPlan = null;
                this.calculatePrice();
              } else {
                this.selectedType = updated;
                this.selectedQuantity = Math.min(
                  this.selectedQuantity,
                  updated.availableCount,
                );
                this.calculatePrice();
              }
            }
            this.checkingAvailability = false;
            resolve();
          },
          error: () => {
            // Fallback to static status if API fails
            this.buildRoomTypeGroups();
            this.checkingAvailability = false;
            resolve();
          },
        });
    }); // end Promise
  }

  // ── Restore selection from booking state (back navigation) ────

  private restoreSelectionFromState(): void {
    const state = this.hotelService.getBookingState();
    if (!state || state.hotelId !== this.hotelId) return;

    // Restore room type selection
    const roomType = state.rooms?.[0]?.roomType;
    if (roomType) {
      const match = this.roomTypeGroups.find((g) => g.type === roomType);
      if (match && match.availableCount >= (state.rooms.length || 1)) {
        this.selectedType = match;
        this.selectedQuantity = state.rooms.length || this.requestedRooms;
      }
    }

    // Restore rate plan selection
    if (state.ratePlanId) {
      const plan = this.ratePlans.find((p) => p._id === state.ratePlanId);
      if (plan) this.selectedPlan = plan;
    }

    this.calculatePrice();
  }

  // ── Room category fits the searched party? ────────────────────

  /**
   * Returns true if this room category can accommodate the searched party.
   * Uses only maxOccupancy today — extend here when maxAdults/maxChildren added.
   * Infants excluded from occupancy (share with parent).
   */
  roomFitsParty(group: RoomTypeGroup): boolean {
    const totalPeople = this.guests + this.children;
    const peoplePerRoom = Math.ceil(totalPeople / this.selectedQuantity);
    return (
      group.maxOccupancy >= peoplePerRoom &&
      group.availableCount >= this.selectedQuantity
    );
  }

  // ── Selection ─────────────────────────────────────────────────

  isTypeSelected(group: RoomTypeGroup): boolean {
    return (
      this.selectedType?.type === group.type &&
      this.selectedType?.bedType === group.bedType
    );
  }

  selectPlan(plan: RatePlan): void {
    this.selectedPlan = this.selectedPlan?._id === plan._id ? null : plan;
    this.calculatePrice();
  }

  selectType(group: RoomTypeGroup): void {
    if (group.availableCount === 0) return;
    if (!this.roomFitsParty(group)) return;
    if (this.isTypeSelected(group)) {
      this.selectedType = null;
      // Don't reset quantity/guests — user may re-select a different type next
    } else {
      this.selectedType = group;
      // Preserve the user's stepper values; only cap to what's available
      this.selectedQuantity = Math.min(
        this.selectedQuantity,
        group.availableCount,
      );
      // Clamp guests to new max if needed, but don't reset
      const maxG = this.getMaxGuests();
      if (this.guests > maxG) this.guests = maxG;
      if (this.children > this.getMaxChildren())
        this.children = this.getMaxChildren();
    }
    this.selectedPlan = null;
    this.calculatePrice();
  }

  incrementQuantity(): void {
    if (!this.selectedType) return;
    if (this.selectedQuantity < this.selectedType.availableCount) {
      this.selectedQuantity++;
      this.calculatePrice();
    }
  }

  decrementQuantity(): void {
    // Can't go below requestedRooms (what they searched for) or 1
    const min = Math.min(this.requestedRooms, this.selectedQuantity);
    if (this.selectedQuantity > Math.max(min, 1)) {
      this.selectedQuantity--;
      this.calculatePrice();
    }
  }

  // ── Rooms ─────────────────────────────────────────────────────

  getRoomOptions(): number[] {
    const max = this.selectedType ? this.selectedType.availableCount : 1;
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  onRoomsChange(): void {
    this.calculatePrice();
  }

  changeRooms(delta: number): void {
    const next = this.selectedQuantity + delta;
    const max = this.getMaxRooms();
    if (next < 1 || next > max) return;
    this.selectedQuantity = next;
    // Ensure guests >= rooms (at least 1 adult per room)
    if (this.guests < this.selectedQuantity)
      this.guests = this.selectedQuantity;
    this.calculatePrice();
  }

  changeGuests(delta: number): void {
    const next = this.guests + delta;
    const min = this.selectedQuantity; // 1 adult per room
    const max = this.getMaxGuests();
    if (next < min || next > max) return;
    this.guests = next;
    // Clamp children if needed
    if (this.children > this.getMaxChildren())
      this.children = this.getMaxChildren();
    this.calculatePrice();
  }

  changeChildren(delta: number): void {
    const next = this.children + delta;
    if (next < 0 || next > this.getMaxChildren()) return;
    this.children = next;
    this.calculatePrice();
  }

  // ── Guests ────────────────────────────────────────────────────

  getMaxRooms(): number {
    if (this.selectedType) return this.selectedType.availableCount;
    // Before selection: cap to the highest availableCount of any group
    if (!this.roomTypeGroups.length) return 9;
    return Math.max(...this.roomTypeGroups.map((g) => g.availableCount), 1);
  }

  getMaxGuests(): number {
    if (this.selectedType)
      return this.selectedType.maxOccupancy * this.selectedQuantity;
    // Before selection: cap to best possible capacity across all available groups
    if (!this.roomTypeGroups.length) return 9;
    const best = Math.max(
      ...this.roomTypeGroups
        .filter((g) => g.availableCount > 0)
        .map((g) => g.maxOccupancy * g.availableCount),
      1,
    );
    return best;
  }

  getGuestOptions(): number[] {
    return Array.from({ length: this.getMaxGuests() }, (_, i) => i + 1);
  }

  getMaxChildren(): number {
    return Math.max(0, this.getMaxGuests() - this.guests);
  }

  getChildrenOptions(): number[] {
    return Array.from({ length: this.getMaxChildren() + 1 }, (_, i) => i);
  }

  // ── Price ──────────────────────────────────────────────────────

  getStartingPrice(): number {
    if (!this.roomTypeGroups.length || !this.hotels) return 0;
    const minBase = Math.min(
      ...this.roomTypeGroups.map((g) => g.basePricePerNight),
    );
    return (
      minBase * (this.hotels.seasonalMultiplier ?? 1) * this.requestedRooms
    );
  }

  // ── Rate plan pricing (industry-standard additive meal charges) ────────────
  // EP  — Room Only          : +₹0   per person / night
  // CP  — Continental Plan   : +₹800 per person / night  (breakfast)
  // MAP — Modified American  : +₹1,500 per person / night (breakfast + dinner)
  // AP  — American Plan      : +₹2,500 per person / night (all meals)

  getPlanMealAddOn(): number {
    if (!this.selectedPlan) return 0;
    const name = this.selectedPlan.planName.toUpperCase();
    const totalPeople = this.guests + this.children;
    if (name.includes('AP') && !name.includes('MAP')) return 2500 * totalPeople;
    if (name.includes('MAP')) return 1500 * totalPeople;
    if (name.includes('CP')) return 800 * totalPeople;
    return 0;
  }

  getPlanLabel(): string {
    if (!this.selectedPlan) return '';
    const name = this.selectedPlan.planName.toUpperCase();
    if (name.includes('AP') && !name.includes('MAP')) return 'AP';
    if (name.includes('MAP')) return 'MAP';
    if (name.includes('CP')) return 'CP';
    return 'EP';
  }

  getMealAddOnForPlan(plan: RatePlan): number {
    const name = plan.planName.toUpperCase();
    if (name.includes('AP') && !name.includes('MAP')) return 2500;
    if (name.includes('MAP')) return 1500;
    if (name.includes('CP')) return 800;
    return 0;
  }

  calculateNights(): number {
    if (!this.checkIn || !this.checkOut) return 0;
    const diff =
      new Date(this.checkOut).getTime() - new Date(this.checkIn).getTime();
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  }

  calculatePrice(): void {
    if (!this.selectedType || !this.hotels) {
      this.baseAmount = this.taxAmount = this.totalAmount = 0;
      return;
    }
    const nights = this.calculateNights();
    const multiplier = this.hotels.seasonalMultiplier;
    // Room cost (per room per night × seasonal multiplier)
    const roomCostPerNight = this.selectedType.basePricePerNight * multiplier;
    const roomTotal = roomCostPerNight * this.selectedQuantity * nights;
    // Meal add-on (per person per night, all nights)
    const mealAddOnPerNight = this.getPlanMealAddOn(); // already × people
    const mealTotal = mealAddOnPerNight * nights;

    this.baseAmount = parseFloat((roomTotal + mealTotal).toFixed(2));
    this.taxAmount = parseFloat(
      ((this.baseAmount * this.hotels.taxPercent) / 100).toFixed(2),
    );
    this.totalAmount = parseFloat(
      (this.baseAmount + this.taxAmount).toFixed(2),
    );
  }

  // ── Date helpers ──────────────────────────────────────────────

  get minCheckOut(): string {
    if (this.checkIn) {
      const d = new Date(this.checkIn);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    }
    return this.today;
  }

  onCheckInChange(): void {
    if (this.checkIn) {
      const max = new Date(this.checkIn);
      max.setDate(max.getDate() + 9);
      this.maxCheckOut = max.toISOString().split('T')[0];
    }
    // Clear checkout if it's same day or before check-in
    if (this.checkOut && this.checkOut <= this.checkIn) {
      this.checkOut = '';
      this.checkOutError = false;
    }
    if (this.checkOut && this.checkOut > this.maxCheckOut) {
      this.checkOut = '';
      this.checkOutError = false;
    }
    if (this.checkIn && this.checkOut) {
      this.refreshAvailability();
    } else {
      this.calculatePrice();
    }
  }

  onCheckOutChange(): void {
    this.checkOutError = this.calculateNights() > 9;
    if (!this.checkOutError && this.checkIn && this.checkOut) {
      this.refreshAvailability();
    }
  }

  // ── Reserve ───────────────────────────────────────────────────

  reserveNow(): void {
    if (!this.selectedType || !this.checkIn || !this.checkOut || !this.hotels)
      return;

    const multiplier = this.hotels.seasonalMultiplier ?? 1;
    const selectedRooms = this.selectedType.availableRooms.slice(
      0,
      this.selectedQuantity,
    );

    // Preserve existing guest details if user is coming back from booking summary
    const existingState = this.hotelService.getBookingState();

    this.hotelService.setBookingState({
      hotelId: this.hotels._id,
      hotelName: this.hotels.name,
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      nights: this.calculateNights(),
      taxPercent: this.hotels.taxPercent,
      marketRate: this.hotels.marketRate || 0,
      rooms: selectedRooms.map((r) => ({
        roomId: r._id,
        roomType: r.type,
        bedType: r.bedType,
        pricePerNight: r.basePricePerNight * multiplier,
        maxOccupancy: r.maxOccupancy,
        images: r.images || [],
        amenities: r.amenities || [],
      })),
      guests: this.guests,
      children: this.children,
      infants: this.infants,
      ratePlanId: this.selectedPlan?._id || '',
      ratePlanName: this.selectedPlan?.planName || 'EP',
      isRefundable: this.selectedPlan?.isRefundable ?? true,
      cancellationHours: this.selectedPlan?.freeCancellationHours || 24,
      couponCode: this.hasCoupon ? this.couponCode : '',
      couponDiscountPercent: this.couponDiscountPercent,
      couponOfferId: this.couponOfferId,
      couponMinNights: this.couponMinNights,
      guestTitle: existingState?.guestTitle,
      firstName: existingState?.firstName,
      lastName: existingState?.lastName,
      email: existingState?.email,
      phone: existingState?.phone,
      aadhaar: existingState?.aadhaar,
    });

    this.router.navigate(['/hotel/booking-summary']);
  }

  goBack(): void {
    this.router.navigate(['/hotel'], { fragment: 'search-form' });
  }

  // ── Misc helpers ──────────────────────────────────────────────

  getSelectedRoomIds(): string[] {
    if (!this.selectedType) return [];
    return this.selectedType.availableRooms
      .slice(0, this.selectedQuantity)
      .map((r) => r._id);
  }

  nextGroupImage(type: string, total: number): void {
    const cur = this.activeGroupImageIndex[type] || 0;
    this.activeGroupImageIndex[type] = (cur + 1) % total;
  }

  prevGroupImage(type: string, total: number, event: Event): void {
    event.stopPropagation();
    const cur = this.activeGroupImageIndex[type] || 0;
    this.activeGroupImageIndex[type] = (cur - 1 + total) % total;
  }

  nextGroupImageStop(type: string, total: number, event: Event): void {
    event.stopPropagation();
    this.nextGroupImage(type, total);
  }

  getGroupImageIndex(type: string): number {
    return this.activeGroupImageIndex[type] || 0;
  }

  hotelImageIndex = 0;

  nextHotelImage(): void {
    const total = this.hotels?.images?.length || 0;
    this.hotelImageIndex = (this.hotelImageIndex + 1) % total;
  }

  prevHotelImage(): void {
    const total = this.hotels?.images?.length || 0;
    this.hotelImageIndex = (this.hotelImageIndex - 1 + total) % total;
  }
}
