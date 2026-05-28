// travel.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';

import { TravelDAO } from './travel.dao';

import { TravelService, TravelBooking } from './travel.model';

import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TransportService {
  private travelDao = inject(TravelDAO);

  // ─── UI State Signals ──────────────────────────────────

  selectedMode = signal<'flight' | 'train' | 'bus'>('flight');

  selectedTrip = signal<TravelService | null>(null);

  selectedSeat = signal<string | null>(null);

  availableTrips = signal<TravelService[]>([]);

  passengerData = signal<any[]>([]);

  passengerCount = signal<number>(1);

  // ─── Bus-specific Signals ──────────────────────────────

  boardingPoint = signal<string | null>(null);

  dropPoint = signal<string | null>(null);

  // ─── Search Persistence Signals ────────────────────────

  searchOrigin = signal<string>('');

  searchDestination = signal<string>('');

  searchDate = signal<string>(new Date().toISOString().split('T')[0]);

  searchCabinClass = signal<string>('');

  // ─── Wallet Signals ────────────────────────────────────

  walletBalance = signal<number>(0);

  walletId = signal<string>('');

  walletTransactions = signal<any[]>([]);

  // ─── Booking Result (for success page) ─────────────────

  lastBookingResult = signal<any>(null);

  // ─── Computed: Current Fare ────────────────────────────

  currentTotal = computed(() => {
    const trip = this.selectedTrip();

    return trip ? trip.fare : 0;
  });

  // ═══════════ WALLET METHODS ════════════════════════════

  async loadWallet(userId: string): Promise<void> {
    const wallets = await firstValueFrom(this.travelDao.getWallet(userId));

    if (wallets.length > 0) {
      this.walletBalance.set(wallets[0].balance);

      this.walletId.set(wallets[0]._id);

      this.walletTransactions.set(wallets[0].transactions || []);
    }
  }

  async deductFromWallet(
    amount: number,
    tripDescription: string,
  ): Promise<void> {
    const newBalance = this.walletBalance() - amount;

    // Update balance

    await firstValueFrom(
      this.travelDao.updateWalletBalance(this.walletId(), newBalance),
    );

    // Add transaction record

    const newTransaction = {
      _id: `txn_${Date.now()}`,

      bookingReference: this.lastBookingResult()?.bookingReference || 'N/A',

      type: 'debit',

      amount: amount,

      balanceAfter: newBalance,

      description: tripDescription,
    };

    const updatedTransactions = [...this.walletTransactions(), newTransaction];

    await firstValueFrom(
      this.travelDao.updateWalletTransactions(
        this.walletId(),
        updatedTransactions,
      ),
    );

    // Update local signals

    this.walletBalance.set(newBalance);

    this.walletTransactions.set(updatedTransactions);
  }

  // ═══════════ CORE BOOKING LOGIC ════════════════════════

  async processBooking(
    service: TravelService,

    passengerList: any[],

    userId: string,

    loyaltyDiscount: number = 0,

    coinsRedeemed: number = 0,

    paymentMethod: 'wallet' | 'razorpay' = 'wallet',

    earnMultiplier: number = 1,
  ) {
    // 1. Calculate pricing (loyalty discount subtracted)
    console.log('process Booking');

    const baseAmount = service.fare * passengerList.length;

    const taxAmount = (baseAmount * service.taxPercent) / 100;

    const totalAmount = baseAmount + taxAmount - loyaltyDiscount;

    const pnr = await this.generateUniquePNR();

    // 2. Map passengers

    const finalizedPassengers = passengerList.map((p, index) => ({
      firstName: p.firstName,

      lastName: p.lastName,

      isPrimary: index === 0,

      idType: p.idType || 'Aadhaar',

      idNumber: p.idNumber || 'N/A',

      seatNumber: p.seatNumber || this.selectedSeat() || 'Pending',

      pnr: `PNR${Math.floor(1000000000 + Math.random() * 9000000000)}`,

      gender: (p.gender || 'male').toLowerCase(),

      ...(service.type === 'train' && p.berthPreference
        ? { berthPreference: p.berthPreference }
        : {}),
    }));

    // 3. Construct booking object

    const newBooking: TravelBooking = {
      userId: userId,

      serviceId: service._id,

      serviceSnapshot: {
        type: service.type,

        operatorName: service.operatorName,

        serviceNumber: service.serviceNumber,

        from: service.from,

        to: service.to,

        departureTime: service.schedule.departureTime,

        arrivalTime: service.schedule.arrivalTime,

        cabinClass: service.cabinClass,
      },

      passengers: finalizedPassengers,

      ...(service.type === 'bus'
        ? {
            boardingPoint: this.boardingPoint() || 'N/A',

            dropPoint: this.dropPoint() || 'N/A',
          }
        : {}),

      pricing: {
        baseAmount: baseAmount,

        taxAmount: taxAmount,

        discountAmount: 0,

        loyaltyDiscount: loyaltyDiscount,

        totalAmount: totalAmount,

        marketRate: service.marketRate * passengerList.length,

        currency: 'INR',
      },

      walletAmountUsed: totalAmount,

      coinsRedeemed: coinsRedeemed,

      coinsEarned: Math.floor((totalAmount / 100) * earnMultiplier), // 1 coin per ₹100 × multiplier

      couponCode: null,

      ticketId: `TKT-${service.serviceNumber}-${Math.floor(100 + Math.random() * 899)}`,

      bookingReference: pnr,

      bookingStatus: 'confirmed',

      paymentStatus: 'paid',

      paymentMethod: paymentMethod,

      bookedAt: new Date().toISOString(),
    };

    // 4. Save booking to db.json

    const result = await firstValueFrom(this.travelDao.saveBooking(newBooking));
    await this.delay(500);

    // 5. Save booked seats

    for (const passenger of newBooking.passengers) {
      if (passenger.seatNumber && passenger.seatNumber !== 'Pending') {
        await firstValueFrom(
          this.travelDao.saveBookedSeat({
            serviceId: service._id,

            seatId: passenger.seatNumber,

            gender:
              passengerList
                .find((p) => p.firstName === passenger.firstName)

                ?.gender?.toLowerCase() || 'male',

            bookingReference: newBooking.bookingReference,
          }),
        );
        await this.delay(500);
      }
    }

    // 6. Update available seats count

    const newAvailable = service.availableSeats - passengerList.length;

    await firstValueFrom(
      this.travelDao.updateAvailableSeats(service._id, newAvailable),
    );
    await this.delay(500);
    // 7. Store result for success page

    this.lastBookingResult.set(result);

    return result;
  }

  // ═══════════ STATE MANAGEMENT ══════════════════════════

  // Save booking state to sessionStorage
  private saveBookingStateToStorage(): void {
    const state = {
      selectedTrip: this.selectedTrip(),
      selectedSeat: this.selectedSeat(),
      passengerData: this.passengerData(),
      passengerCount: this.passengerCount(),
      boardingPoint: this.boardingPoint(),
      dropPoint: this.dropPoint(),
      searchOrigin: this.searchOrigin(),
      searchDestination: this.searchDestination(),
      searchDate: this.searchDate(),
      selectedMode: this.selectedMode(),
    };
    sessionStorage.setItem('travelBookingState', JSON.stringify(state));
  }

  // Restore booking state from sessionStorage
  restoreBookingStateFromStorage(): boolean {
    const stored = sessionStorage.getItem('travelBookingState');
    if (!stored) return false;

    try {
      const state = JSON.parse(stored);
      if (state.selectedTrip) this.selectedTrip.set(state.selectedTrip);
      if (state.selectedSeat) this.selectedSeat.set(state.selectedSeat);
      if (state.passengerData) this.passengerData.set(state.passengerData);
      if (state.passengerCount) this.passengerCount.set(state.passengerCount);
      if (state.boardingPoint) this.boardingPoint.set(state.boardingPoint);
      if (state.dropPoint) this.dropPoint.set(state.dropPoint);
      if (state.searchOrigin) this.searchOrigin.set(state.searchOrigin);
      if (state.searchDestination)
        this.searchDestination.set(state.searchDestination);
      if (state.searchDate) this.searchDate.set(state.searchDate);
      if (state.selectedMode) this.selectedMode.set(state.selectedMode);
      return true;
    } catch (e) {
      console.error('Failed to restore travel booking state', e);
      return false;
    }
  }

  clearBookingState(): void {
    this.selectedTrip.set(null);
    this.selectedSeat.set(null);
    this.passengerData.set([]);
    this.boardingPoint.set(null);
    this.dropPoint.set(null);
    sessionStorage.removeItem('travelBookingState');
  }

  // Save search results to sessionStorage
  saveSearchResults(): void {
    const searchState = {
      availableTrips: this.availableTrips(),
      searchOrigin: this.searchOrigin(),
      searchDestination: this.searchDestination(),
      searchDate: this.searchDate(),
      selectedMode: this.selectedMode(),
      searchCabinClass: this.searchCabinClass(),
    };
    sessionStorage.setItem('travelSearchResults', JSON.stringify(searchState));
  }

  // Restore search results from sessionStorage
  restoreSearchResults(): boolean {
    const stored = sessionStorage.getItem('travelSearchResults');
    if (!stored) return false;
    try {
      const state = JSON.parse(stored);
      if (state.availableTrips) this.availableTrips.set(state.availableTrips);
      if (state.searchOrigin) this.searchOrigin.set(state.searchOrigin);
      if (state.searchDestination)
        this.searchDestination.set(state.searchDestination);
      if (state.searchDate) this.searchDate.set(state.searchDate);
      if (state.selectedMode) this.selectedMode.set(state.selectedMode);
      if (state.searchCabinClass)
        this.searchCabinClass.set(state.searchCabinClass);
      return true;
    } catch (e) {
      console.error('Failed to restore search results', e);
      return false;
    }
  }

  clearSearchResults(): void {
    this.availableTrips.set([]);
    this.searchOrigin.set('');
    this.searchDestination.set('');
    this.searchDate.set(new Date().toISOString().split('T')[0]);
    this.searchCabinClass.set('');
    sessionStorage.removeItem('travelSearchResults');
  }

  // ═══════════ HELPERS ═══════════════════════════════════

  private async generateUniquePNR(): Promise<string> {
    const pnr = `TRV-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const existing = await firstValueFrom(this.travelDao.checkPnrUnique(pnr));

    return existing && existing.length > 0 ? this.generateUniquePNR() : pnr;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
