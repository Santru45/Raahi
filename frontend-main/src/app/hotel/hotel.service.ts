import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { HotelDao } from './hotel.dao';
import { Hotel, RoomDetails } from './model/hotel.model';
import { forkJoin } from 'rxjs';
import { RatePlan } from './model/hotel.model';

export interface SearchFilter {
  maxPrice: number;
  starRating: number | null;
  amenities: string[];
  hotelTypes: string[];
  searchText: string;
}

export interface HotelSearchState {
  destination: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  infants: number;
  allHotels: Hotel[];
  hotels: Hotel[];
  roomPriceMap: { [hotelId: string]: number };
  filter: SearchFilter;
  showResults: boolean;
}

export interface BookingRoom {
  roomId: string;
  roomType: string;
  bedType: string;
  pricePerNight: number;
  maxOccupancy: number;
  images: string[];
  amenities: string[];
}

export interface BookingState {
  hotelId: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  taxPercent: number;
  marketRate: number;
  rooms: BookingRoom[];
  guests: number;
  children: number;
  infants: number;
  ratePlanId: string;
  ratePlanName: string;
  isRefundable: boolean;
  cancellationHours: number;
  couponCode: string;
  couponDiscountPercent: number;
  couponOfferId: string;
  couponMinNights: number;
  guestTitle?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  aadhaar?: string;
}

@Injectable({ providedIn: 'root' })
export class HotelService {
  dao = inject(HotelDao);

  // Wallet balance signal for reactive UI updates
  walletBalance = signal<number | null>(null);

  searchState: HotelSearchState = {
    destination: '',
    checkIn: '',
    checkOut: '',
    rooms: 1,
    adults: 1,
    children: 0,
    infants: 0,
    allHotels: [],
    hotels: [],
    roomPriceMap: {},
    filter: {
      maxPrice: 20000,
      starRating: null,
      amenities: [],
      hotelTypes: [],
      searchText: '',
    },
    showResults: false,
  };

  private bookingState: BookingState | null = null;

  hasSearchResults(): boolean {
    return (
      this.searchState.showResults && this.searchState.allHotels.length > 0
    );
  }

  // Save search state to sessionStorage
  saveSearchState(): void {
    sessionStorage.setItem(
      'hotelSearchState',
      JSON.stringify(this.searchState),
    );
  }

  // Restore search state from sessionStorage
  restoreSearchState(): boolean {
    const stored = sessionStorage.getItem('hotelSearchState');
    if (!stored) return false;
    try {
      this.searchState = JSON.parse(stored);
      return true;
    } catch (e) {
      console.error('Failed to restore search state', e);
      return false;
    }
  }

  // Clear search state
  clearSearchState(): void {
    this.searchState = {
      destination: '',
      checkIn: '',
      checkOut: '',
      rooms: 1,
      adults: 1,
      children: 0,
      infants: 0,
      allHotels: [],
      hotels: [],
      roomPriceMap: {},
      filter: {
        maxPrice: 20000,
        starRating: null,
        amenities: [],
        hotelTypes: [],
        searchText: '',
      },
      showResults: false,
    };
    sessionStorage.removeItem('hotelSearchState');
  }

  setBookingState(state: BookingState): void {
    this.bookingState = state;
    // Persist to sessionStorage
    sessionStorage.setItem('hotelBookingState', JSON.stringify(state));
  }

  getBookingState(): BookingState | null {
    // Try to get from memory first
    if (this.bookingState) {
      return this.bookingState;
    }
    // If not in memory, try to restore from sessionStorage
    const stored = sessionStorage.getItem('hotelBookingState');
    if (stored) {
      try {
        this.bookingState = JSON.parse(stored);
        return this.bookingState;
      } catch (e) {
        console.error('Failed to parse booking state from sessionStorage', e);
      }
    }
    return null;
  }

  hasBookingState(): boolean {
    return this.bookingState !== null && this.bookingState.rooms.length > 0;
  }

  clearBookingState(): void {
    this.bookingState = null;
    sessionStorage.removeItem('hotelBookingState');
  }

  getCities(): Observable<string[]> {
    return this.dao.getMeta().pipe(map((meta) => meta.cities));
  }

  getHotelsByCity(city: string, useSearch = false): Observable<Hotel[]> {
    if (!city) return this.dao.getAllHotels();
    if (useSearch) return this.dao.getAllHotels({ search: city });
    return this.dao.getAllHotels({ city });
  }

  searchHotels(params: {
    city?: string;
    useSearch?: boolean;
    starRating?: number | null;
    amenities?: string[];
    hotelTypes?: string[];
    name?: string;
  }): Observable<Hotel[]> {
    return this.dao.getAllHotels({
      ...(params.useSearch && params.city
        ? { search: params.city }
        : { city: params.city }),
      starRating: params.starRating ?? undefined,
      amenities: params.amenities,
      hotelType:
        params.hotelTypes && params.hotelTypes.length > 0
          ? params.hotelTypes.join(',')
          : undefined,
      name: params.name,
    });
  }

  getHotelById(id: string): Observable<Hotel> {
    return this.dao.getHotelById(id);
  }

  getTotalreview(hotelId: string): Observable<number> {
    return this.dao
      .getTotalReview(hotelId)
      .pipe(map((reviews) => reviews.length));
  }

  getAmenities(): Observable<string[]> {
    return this.dao.getMeta().pipe(map((meta) => meta.amenities));
  }

  getHotelType(): Observable<string[]> {
    return this.dao.getMeta().pipe(map((meta) => meta.hotelTypes));
  }

  createBooking(booking: any): Observable<any> {
    return this.dao.createBooking(booking);
  }

  validateCoupon(
    couponCode: string,
    hotelId: string,
    roomType: string,
    nights: number,
  ): Observable<any> {
    return this.dao.validateCoupon(couponCode, hotelId, roomType, nights);
  }

  getMyBookings(userId: string): Observable<any[]> {
    return this.dao.getMyBookings(userId);
  }

  cancelBooking(bookingId: string): Observable<any> {
    return this.dao.cancelBooking(bookingId);
  }

  getHotelWithRoomsAndPlans(hotelId: string): Observable<any> {
    return forkJoin({
      hotel: this.dao.getHotelById(hotelId),
      rooms: this.dao.getRoomsByHotelId(hotelId),
      ratePlans: this.dao.getRatePlansByHotelId(hotelId),
    });
  }

  getAvailableRooms(
    hotelId: string,
    checkIn: string,
    checkOut: string,
  ): Observable<RoomDetails[]> {
    return this.dao.getAvailableRoomsByHotelId(hotelId, checkIn, checkOut);
  }

  updateRoomStatus(roomId: string): Observable<any> {
    return this.dao.updateRoomStatus(roomId, 'occupied');
  }

  setRoomAvailable(roomId: string): Observable<any> {
    return this.dao.setRoomAvailable(roomId);
  }

  getAllRooms(): Observable<RoomDetails[]> {
    return this.dao.getAllRooms();
  }

  getWalletByUserId(userId: string): Observable<any> {
    return this.dao.getWalletByUserId(userId).pipe(
      tap((wallet) => {
        if (wallet?.balance !== undefined) {
          this.walletBalance.set(wallet.balance);
        }
      }),
    );
  }

  deductFromWallet(
    walletId: string,
    currentBalance: number,
    amount: number,
    transactions: any[],
    bookingReference: string,
  ): Observable<any> {
    const newBalance = currentBalance - amount;
    // Optimistic update
    this.walletBalance.set(newBalance);

    const newTransaction = {
      _id: `txn_${Date.now()}`,
      bookingReference,
      type: 'debit',
      amount,
      balanceAfter: newBalance,
      description: 'Hotel booking payment',
    };
    return this.dao
      .updateWalletBalance(walletId, newBalance, [
        ...transactions,
        newTransaction,
      ])
      .pipe(
        tap((wallet) => {
          // Confirm the balance after successful update
          if (wallet?.balance !== undefined) {
            this.walletBalance.set(wallet.balance);
          }
        }),
      );
  }

  getLoyaltyByUserId(userId: string): Observable<any> {
    return this.dao
      .getLoyaltyByUserId(userId)
      .pipe(map((accounts) => accounts[0]));
  }

  isValidCity(city: string, allCities: string[]): boolean {
    return allCities.some((c) => c.toLowerCase() === city.toLowerCase());
  }
}
