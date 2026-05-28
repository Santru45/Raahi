import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { HotelMyBookingsComponent } from './hotel-my-bookings.component';
import { HotelService } from '../hotel.service';
import { AuthService } from '../../auth/auth.service';
import { LoyaltyService } from '../../profile/loyalty/loyalty-service';
import { TravelDAO } from '../../travel/travel.dao';

describe('HotelMyBookingsComponent', () => {
  let component: HotelMyBookingsComponent;
  let fixture: ComponentFixture<HotelMyBookingsComponent>;

  const mockHotelService = {
    getMyBookings: jasmine.createSpy('getMyBookings').and.returnValue(of([])),
    cancelBooking: jasmine.createSpy('cancelBooking').and.returnValue(of({})),
    setRoomAvailable: jasmine
      .createSpy('setRoomAvailable')
      .and.returnValue(of({})),
  };
  const mockAuthService = {
    getCurrentUser: jasmine
      .createSpy('getCurrentUser')
      .and.returnValue({ _id: 'u1' }),
  };
  const mockLoyaltyService = {
    handleBookingCancellation: jasmine
      .createSpy('handleBookingCancellation')
      .and.returnValue(of({})),
    refreshCoinBalance: jasmine.createSpy('refreshCoinBalance'),
  };
  const mockTravelDAO = {
    getMyTravelBookings: jasmine
      .createSpy('getMyTravelBookings')
      .and.returnValue(of([])),
    cancelTravelBooking: jasmine
      .createSpy('cancelTravelBooking')
      .and.returnValue(of({})),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelMyBookingsComponent, RouterTestingModule],
      providers: [
        { provide: HotelService, useValue: mockHotelService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LoyaltyService, useValue: mockLoyaltyService },
        { provide: TravelDAO, useValue: mockTravelDAO },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelMyBookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to hotel tab', () => {
    expect(component.activeTab).toBe('hotel');
  });

  it('should have empty search query', () => {
    expect(component.searchQuery).toBe('');
  });

  it('should default status filter to all', () => {
    expect(component.statusFilter).toBe('all');
  });

  it('should not show toast initially', () => {
    expect(component.showToast).toBeFalse();
  });

  it('should not show confirm modal initially', () => {
    expect(component.showConfirmModal).toBeFalse();
  });

  it('should start on page 1 for both tabs', () => {
    expect(component.hotelPage).toBe(1);
    expect(component.travelPage).toBe(1);
  });

  it('should not be cancelling initially', () => {
    expect(component.isCancelling).toBeFalse();
  });

  // --- setTab ---
  it('setTab should switch activeTab and reset filters', () => {
    component.searchQuery = 'test';
    component.statusFilter = 'confirmed';
    component.setTab('travel');
    expect(component.activeTab).toBe('travel');
    expect(component.searchQuery).toBe('');
    expect(component.statusFilter).toBe('all');
    expect(component.hotelPage).toBe(1);
    expect(component.travelPage).toBe(1);
  });

  // --- promptCancel / dismissCancel ---
  it('promptCancel should set bookingToCancel and show modal', () => {
    const booking = { _id: 'b1', bookingStatus: 'confirmed' };
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    component.promptCancel(booking, 'hotel', event);
    expect(component.bookingToCancel).toBe(booking);
    expect(component.bookingType).toBe('hotel');
    expect(component.showConfirmModal).toBeTrue();
  });

  it('dismissCancel should clear bookingToCancel and hide modal', () => {
    component.bookingToCancel = { _id: 'b1' };
    component.showConfirmModal = true;
    component.dismissCancel();
    expect(component.bookingToCancel).toBeNull();
    expect(component.showConfirmModal).toBeFalse();
  });

  // --- onFilterChange ---
  it('onFilterChange should reset pages to 1', () => {
    component.hotelPage = 3;
    component.travelPage = 2;
    component.onFilterChange();
    expect(component.hotelPage).toBe(1);
    expect(component.travelPage).toBe(1);
  });

  // --- filteredHotelBookings ---
  it('filteredHotelBookings should return all when statusFilter is all', () => {
    component.hotelBookings = [
      {
        bookingStatus: 'confirmed',
        hotelName: 'Taj',
        bookingReference: 'R1',
        roomSnapshot: { roomType: 'Deluxe' },
      },
      {
        bookingStatus: 'cancelled',
        hotelName: 'Oberoi',
        bookingReference: 'R2',
        roomSnapshot: { roomType: 'Suite' },
      },
    ];
    component.statusFilter = 'all';
    component.searchQuery = '';
    expect(component.filteredHotelBookings.length).toBe(2);
  });

  it('filteredHotelBookings should filter by statusFilter', () => {
    component.hotelBookings = [
      {
        bookingStatus: 'confirmed',
        hotelName: 'Taj',
        bookingReference: 'R1',
        roomSnapshot: { roomType: 'Deluxe' },
      },
      {
        bookingStatus: 'cancelled',
        hotelName: 'Oberoi',
        bookingReference: 'R2',
        roomSnapshot: { roomType: 'Suite' },
      },
    ];
    component.statusFilter = 'confirmed';
    component.searchQuery = '';
    expect(component.filteredHotelBookings.length).toBe(1);
    expect(component.filteredHotelBookings[0].hotelName).toBe('Taj');
  });

  it('filteredHotelBookings should filter by search query on hotelName', () => {
    component.hotelBookings = [
      {
        bookingStatus: 'confirmed',
        hotelName: 'Taj Hotel',
        bookingReference: 'R1',
        roomSnapshot: { roomType: 'Deluxe' },
      },
      {
        bookingStatus: 'confirmed',
        hotelName: 'Oberoi',
        bookingReference: 'R2',
        roomSnapshot: { roomType: 'Suite' },
      },
    ];
    component.statusFilter = 'all';
    component.searchQuery = 'taj';
    expect(component.filteredHotelBookings.length).toBe(1);
  });

  // --- filteredTravelBookings ---
  it('filteredTravelBookings should filter by search query on bookingReference', () => {
    component.travelBookings = [
      {
        bookingStatus: 'confirmed',
        bookingReference: 'TR001',
        serviceSnapshot: {
          operatorName: 'SpiceJet',
          serviceNumber: 'SG101',
          from: 'DEL',
          to: 'BOM',
        },
      },
      {
        bookingStatus: 'confirmed',
        bookingReference: 'TR002',
        serviceSnapshot: {
          operatorName: 'IndiGo',
          serviceNumber: 'IG202',
          from: 'BOM',
          to: 'DEL',
        },
      },
    ];
    component.statusFilter = 'all';
    component.searchQuery = 'TR001';
    expect(component.filteredTravelBookings.length).toBe(1);
  });

  // --- pagedHotelBookings / totalHotelPages ---
  it('pagedHotelBookings should return all when fewer than PAGE_SIZE', () => {
    component.hotelBookings = [
      {
        bookingStatus: 'confirmed',
        hotelName: 'Taj',
        bookingReference: 'R1',
        roomSnapshot: { roomType: 'Deluxe' },
      },
    ];
    component.statusFilter = 'all';
    component.searchQuery = '';
    expect(component.pagedHotelBookings.length).toBe(1);
  });

  it('totalHotelPages should be at least 1', () => {
    component.hotelBookings = [];
    component.statusFilter = 'all';
    component.searchQuery = '';
    expect(component.totalHotelPages).toBe(1);
  });

  it('totalTravelPages should be at least 1', () => {
    component.travelBookings = [];
    component.statusFilter = 'all';
    component.searchQuery = '';
    expect(component.totalTravelPages).toBe(1);
  });

  // --- setHotelPage ---
  it('setHotelPage should not go below 1', () => {
    component.hotelPage = 1;
    component.setHotelPage(0);
    expect(component.hotelPage).toBe(1);
  });

  it('setTravelPage should not go below 1', () => {
    component.travelPage = 1;
    component.setTravelPage(0);
    expect(component.travelPage).toBe(1);
  });

  // --- getModeIcon ---
  it('getModeIcon should return flight icon', () => {
    expect(component.getModeIcon('flight')).toBe('bi-airplane-fill');
  });

  it('getModeIcon should return train icon', () => {
    expect(component.getModeIcon('train')).toBe('bi-train-front-fill');
  });

  it('getModeIcon should return bus icon', () => {
    expect(component.getModeIcon('bus')).toBe('bi-bus-front-fill');
  });

  it('getModeIcon should return default icon for unknown type', () => {
    expect(component.getModeIcon('other')).toBe('bi-ticket-perforated');
  });

  // --- statusBg / statusFg ---
  it('statusBg should return confirmed color', () => {
    expect(component.statusBg('confirmed')).toBe('#d1fae5');
  });

  it('statusBg should return cancelled color', () => {
    expect(component.statusBg('cancelled')).toBe('#fee2e2');
  });

  it('statusFg should return confirmed color', () => {
    expect(component.statusFg('confirmed')).toBe('#065f46');
  });

  it('statusFg should return cancelled color', () => {
    expect(component.statusFg('cancelled')).toBe('#991b1b');
  });

  // --- viewHotel / closeHotelTicketModal ---
  it('viewHotel should set selectedHotelBooking and show modal', () => {
    const booking = {
      _id: 'b1',
      bookingReference: 'REF001',
      hotelName: 'Taj',
      checkIn: '2026-06-01',
      checkOut: '2026-06-03',
    };
    component.viewHotel(booking);
    expect(component.selectedHotelBooking).toBe(booking);
    expect(component.showHotelTicketModal).toBeTrue();
    expect(component.hotelQrUrl).toContain('REF001');
  });

  it('closeHotelTicketModal should clear state', () => {
    component.showHotelTicketModal = true;
    component.selectedHotelBooking = { _id: 'b1' };
    component.closeHotelTicketModal();
    expect(component.showHotelTicketModal).toBeFalse();
    expect(component.selectedHotelBooking).toBeNull();
  });

  // --- viewTicket / closeTicketModal ---
  it('viewTicket should set selectedTicket and show modal', () => {
    const booking = { _id: 't1', bookingReference: 'TR001' };
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    component.viewTicket(booking, event);
    expect(component.selectedTicket).toBe(booking);
    expect(component.showTicketModal).toBeTrue();
  });

  it('closeTicketModal should clear state', () => {
    component.showTicketModal = true;
    component.selectedTicket = { _id: 't1' };
    component.closeTicketModal();
    expect(component.showTicketModal).toBeFalse();
    expect(component.selectedTicket).toBeNull();
  });

  // --- isCancellable ---
  it('isCancellable should return true for confirmed hotel booking with future checkIn', () => {
    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const booking = { bookingStatus: 'confirmed', checkIn: futureDate };
    expect(component.isCancellable(booking, 'hotel')).toBeTrue();
  });

  it('isCancellable should return false for cancelled booking', () => {
    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const booking = { bookingStatus: 'cancelled', checkIn: futureDate };
    expect(component.isCancellable(booking, 'hotel')).toBeFalse();
  });

  it('isCancellable should return false for hotel booking with past checkIn', () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    const booking = { bookingStatus: 'confirmed', checkIn: pastDate };
    expect(component.isCancellable(booking, 'hotel')).toBeFalse();
  });

  it('isCancellable should return true for confirmed travel booking with future departure', () => {
    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const booking = {
      bookingStatus: 'confirmed',
      serviceSnapshot: { departureTime: futureDate },
    };
    expect(component.isCancellable(booking, 'travel')).toBeTrue();
  });

  // --- getCancellationPolicy ---
  it('getCancellationPolicy should return full refund for 48+ hours', () => {
    const checkIn = new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString();
    const policy = component.getCancellationPolicy({
      checkIn,
      coinsEarned: 0,
      coinsRedeemed: 0,
    });
    expect(policy.tier).toBe('free');
    expect(policy.refundPct).toBe(100);
  });

  it('getCancellationPolicy should return 50% refund for 24-48 hours', () => {
    const checkIn = new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString();
    const policy = component.getCancellationPolicy({
      checkIn,
      coinsEarned: 0,
      coinsRedeemed: 0,
    });
    expect(policy.tier).toBe('partial');
    expect(policy.refundPct).toBe(50);
  });

  it('getCancellationPolicy should return no refund for <24 hours', () => {
    const checkIn = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString();
    const policy = component.getCancellationPolicy({
      checkIn,
      coinsEarned: 5,
      coinsRedeemed: 0,
    });
    expect(policy.tier).toBe('none');
    expect(policy.refundPct).toBe(0);
  });

  it('getCancellationPolicy full refund with coins should mention earned coins', () => {
    const checkIn = new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString();
    const policy = component.getCancellationPolicy({
      checkIn,
      coinsEarned: 100,
      coinsRedeemed: 50,
    });
    expect(policy.coinNote).toContain('100');
  });

  it('getCancellationPolicy 50% refund with coins should mention clawback', () => {
    const checkIn = new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString();
    const policy = component.getCancellationPolicy({
      checkIn,
      coinsEarned: 100,
      coinsRedeemed: 50,
    });
    expect(policy.coinNote).toContain('50');
  });

  // --- getTravelCancellationPolicy ---
  it('getTravelCancellationPolicy should return full refund for 24+ hours', () => {
    const dep = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();
    const policy = component.getTravelCancellationPolicy({
      serviceSnapshot: { departureTime: dep },
      coinsEarned: 0,
      coinsRedeemed: 0,
    });
    expect(policy.tier).toBe('free');
    expect(policy.refundPct).toBe(100);
  });

  it('getTravelCancellationPolicy should return 50% for 6-24 hours', () => {
    const dep = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString();
    const policy = component.getTravelCancellationPolicy({
      serviceSnapshot: { departureTime: dep },
      coinsEarned: 0,
      coinsRedeemed: 0,
    });
    expect(policy.tier).toBe('partial');
    expect(policy.refundPct).toBe(50);
  });

  it('getTravelCancellationPolicy should return 25% for 2-6 hours', () => {
    const dep = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    const policy = component.getTravelCancellationPolicy({
      serviceSnapshot: { departureTime: dep },
      coinsEarned: 0,
      coinsRedeemed: 0,
    });
    expect(policy.tier).toBe('low');
    expect(policy.refundPct).toBe(25);
  });

  it('getTravelCancellationPolicy should return no refund for <2 hours', () => {
    const dep = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const policy = component.getTravelCancellationPolicy({
      serviceSnapshot: { departureTime: dep },
      coinsEarned: 0,
      coinsRedeemed: 0,
    });
    expect(policy.tier).toBe('none');
    expect(policy.refundPct).toBe(0);
  });

  it('getTravelCancellationPolicy with no departureTime should return full refund', () => {
    const policy = component.getTravelCancellationPolicy({
      serviceSnapshot: {},
      coinsEarned: 0,
      coinsRedeemed: 0,
    });
    expect(policy.tier).toBe('free');
  });

  it('getTravelCancellationPolicy with coins in full refund tier should mention clawback', () => {
    const dep = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();
    const policy = component.getTravelCancellationPolicy({
      serviceSnapshot: { departureTime: dep },
      coinsEarned: 200,
      coinsRedeemed: 0,
    });
    expect(policy.coinNote).toContain('200');
  });

  // --- hotelPageNumbers / travelPageNumbers ---
  it('hotelPageNumbers should return array containing page 1', () => {
    expect(component.hotelPageNumbers()).toContain(1);
  });

  it('travelPageNumbers should return array containing page 1', () => {
    expect(component.travelPageNumbers()).toContain(1);
  });
});
