import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TransportService } from './travel.service';
import { TravelDAO } from './travel.dao';

describe('TransportService', () => {
  let service: TransportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TransportService, TravelDAO],
    });
    service = TestBed.inject(TransportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── Signals defaults ──────────────────────────────────────────────────────
  it('should have default selectedMode as flight', () => {
    expect(service.selectedMode()).toBe('flight');
  });

  it('should have null selectedTrip initially', () => {
    expect(service.selectedTrip()).toBeNull();
  });

  it('should have null selectedSeat initially', () => {
    expect(service.selectedSeat()).toBeNull();
  });

  it('should have empty availableTrips initially', () => {
    expect(service.availableTrips().length).toBe(0);
  });

  it('should have 1 passenger count by default', () => {
    expect(service.passengerCount()).toBe(1);
  });

  it('should have walletBalance 0 by default', () => {
    expect(service.walletBalance()).toBe(0);
  });

  // ── currentTotal computed ─────────────────────────────────────────────────
  it('should return 0 when no trip selected', () => {
    expect(service.currentTotal()).toBe(0);
  });

  it('should return fare of selected trip', () => {
    service.selectedTrip.set({ fare: 2500 } as any);
    expect(service.currentTotal()).toBe(2500);
  });

  // ── clearBookingState ─────────────────────────────────────────────────────
  it('should reset all booking state signals', () => {
    service.selectedTrip.set({ fare: 1000 } as any);
    service.selectedSeat.set('A1');
    service.boardingPoint.set('Stop A');
    service.dropPoint.set('Stop B');
    service.searchOrigin.set('Delhi');
    service.searchDestination.set('Mumbai');

    service.clearBookingState();

    expect(service.selectedTrip()).toBeNull();
    expect(service.selectedSeat()).toBeNull();
    expect(service.boardingPoint()).toBeNull();
    expect(service.dropPoint()).toBeNull();
    expect(service.searchOrigin()).toBe('');
    expect(service.searchDestination()).toBe('');
  });

  // ── loadWallet ────────────────────────────────────────────────────────────
  it('should load wallet balance from API', async () => {
    const promise = service.loadWallet('u1');

    const req = httpMock.expectOne((r) => r.url.includes('/wallets/u1'));
    req.flush({ _id: 'w1', balance: 5000, transactions: [] });

    await promise;
    expect(service.walletBalance()).toBe(5000);
    expect(service.walletId()).toBe('w1');
  });

  it('should handle empty wallet response', async () => {
    const promise = service.loadWallet('u1');

    const req = httpMock.expectOne((r) => r.url.includes('/wallets/u1'));
    req.flush(null);

    await promise;
    // walletBalance stays at 0 since no wallet found
  });

  // ── Search signals ────────────────────────────────────────────────────────
  it('should have todays date as default searchDate', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(service.searchDate()).toBe(today);
  });

  it('should allow setting search signals', () => {
    service.searchOrigin.set('Delhi');
    service.searchDestination.set('Mumbai');
    service.searchCabinClass.set('economy');

    expect(service.searchOrigin()).toBe('Delhi');
    expect(service.searchDestination()).toBe('Mumbai');
    expect(service.searchCabinClass()).toBe('economy');
  });

  // ── Bus-specific ──────────────────────────────────────────────────────────
  it('should have null boarding and drop points by default', () => {
    expect(service.boardingPoint()).toBeNull();
    expect(service.dropPoint()).toBeNull();
  });

  it('should set boarding and drop points', () => {
    service.boardingPoint.set('Central Bus Stand');
    service.dropPoint.set('Airport Terminal');
    expect(service.boardingPoint()).toBe('Central Bus Stand');
    expect(service.dropPoint()).toBe('Airport Terminal');
  });
});
