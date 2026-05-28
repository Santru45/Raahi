import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HotelService } from './hotel.service';
import { HotelDao } from './hotel.dao';

describe('HotelService', () => {
  let service: HotelService;
  let httpMock: HttpTestingController;

  const mockHotels = [
    {
      _id: 'h1',
      name: 'Hotel A',
      location: {
        city: 'Delhi',
        address: '',
        state: '',
        country: 'India',
        coordinates: { lat: 0, lng: 0 },
      },
      amenities: ['WiFi', 'Pool'],
      hotelType: 'luxury',
      starRating: 4.5,
      images: [],
    },
    {
      _id: 'h2',
      name: 'Hotel B',
      location: {
        city: 'Mumbai',
        address: '',
        state: '',
        country: 'India',
        coordinates: { lat: 0, lng: 0 },
      },
      amenities: ['WiFi', 'Gym'],
      hotelType: 'budget',
      starRating: 3.0,
      images: [],
    },
    {
      _id: 'h3',
      name: 'Hotel C',
      location: {
        city: 'Delhi',
        address: '',
        state: '',
        country: 'India',
        coordinates: { lat: 0, lng: 0 },
      },
      amenities: ['Pool'],
      hotelType: 'luxury',
      starRating: 5.0,
      images: [],
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HotelService, HotelDao],
    });
    service = TestBed.inject(HotelService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── Search State ──────────────────────────────────────────────────────────
  it('should have default search state', () => {
    expect(service.searchState.destination).toBe('');
    expect(service.searchState.rooms).toBe(1);
    expect(service.searchState.adults).toBe(1);
    expect(service.searchState.showResults).toBeFalse();
  });

  it('should return false for hasSearchResults when no results', () => {
    expect(service.hasSearchResults()).toBeFalse();
  });

  it('should return true for hasSearchResults when results exist', () => {
    service.searchState.showResults = true;
    service.searchState.allHotels = mockHotels as any;
    expect(service.hasSearchResults()).toBeTrue();
  });

  // ── Booking State ─────────────────────────────────────────────────────────
  it('should return null for getBookingState initially', () => {
    expect(service.getBookingState()).toBeNull();
  });

  it('should set and get booking state', () => {
    const state = { hotelId: 'h1', hotelName: 'Hotel A', rooms: [] } as any;
    service.setBookingState(state);
    expect(service.getBookingState()).toEqual(state);
  });

  it('should return false for hasBookingState when no rooms', () => {
    service.setBookingState({ rooms: [] } as any);
    expect(service.hasBookingState()).toBeFalse();
  });

  it('should return true for hasBookingState with rooms', () => {
    service.setBookingState({ rooms: [{ roomId: 'r1' }] } as any);
    expect(service.hasBookingState()).toBeTrue();
  });

  it('should clear booking state', () => {
    service.setBookingState({ rooms: [{ roomId: 'r1' }] } as any);
    service.clearBookingState();
    expect(service.getBookingState()).toBeNull();
  });

  // ── getCities ─────────────────────────────────────────────────────────────
  it('should return unique cities from hotels', () => {
    service.getCities().subscribe((cities) => {
      expect(cities).toContain('Delhi');
      expect(cities).toContain('Mumbai');
      expect(cities.length).toBe(2);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/hotels'));
    req.flush(mockHotels);
  });

  // ── getHotelsByCity ───────────────────────────────────────────────────────
  it('should filter hotels by city', () => {
    service.getHotelsByCity('Delhi').subscribe((hotels) => {
      expect(hotels.length).toBe(2);
      expect(hotels.every((h) => h.location.city === 'Delhi')).toBeTrue();
    });

    const req = httpMock.expectOne((r) => r.url.includes('/hotels'));
    req.flush(mockHotels);
  });

  it('should return all hotels when city is empty', () => {
    service.getHotelsByCity('').subscribe((hotels) => {
      expect(hotels.length).toBe(3);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/hotels'));
    req.flush(mockHotels);
  });

  // ── getAmenities ──────────────────────────────────────────────────────────
  it('should return unique amenities from all hotels', () => {
    service.getAmenities().subscribe((amenities) => {
      expect(amenities).toContain('WiFi');
      expect(amenities).toContain('Pool');
      expect(amenities).toContain('Gym');
      expect(amenities.length).toBe(3);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/hotels'));
    req.flush(mockHotels);
  });

  // ── getHotelType ──────────────────────────────────────────────────────────
  it('should return unique hotel types', () => {
    service.getHotelType().subscribe((types) => {
      expect(types).toContain('luxury');
      expect(types).toContain('budget');
      expect(types.length).toBe(2);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/hotels'));
    req.flush(mockHotels);
  });

  // ── isValidCity ───────────────────────────────────────────────────────────
  it('should validate city case-insensitively', () => {
    expect(service.isValidCity('delhi', ['Delhi', 'Mumbai'])).toBeTrue();
    expect(service.isValidCity('MUMBAI', ['Delhi', 'Mumbai'])).toBeTrue();
    expect(service.isValidCity('Goa', ['Delhi', 'Mumbai'])).toBeFalse();
  });

  // ── getHotelById ──────────────────────────────────────────────────────────
  it('should fetch a single hotel by id', () => {
    service.getHotelById('h1').subscribe((hotel) => {
      expect(hotel.name).toBe('Hotel A');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/hotels/h1'));
    req.flush(mockHotels[0]);
  });

  // ── createBooking ─────────────────────────────────────────────────────────
  it('should post a booking', () => {
    const booking = { hotelId: 'h1', userId: 'u1' };
    service.createBooking(booking).subscribe((res) => {
      expect(res.bookingReference).toBe('BK-001');
    });

    const req = httpMock.expectOne(
      (r) => r.url.includes('/hotel-bookings') && r.method === 'POST',
    );
    req.flush({ bookingReference: 'BK-001' });
  });

  // ── cancelBooking ─────────────────────────────────────────────────────────
  it('should cancel a booking', () => {
    service.cancelBooking('bk1').subscribe((res) => {
      expect(res.bookingStatus).toBe('cancelled');
    });

    const req = httpMock.expectOne((r) =>
      r.url.includes('/hotel-bookings/bk1/cancel'),
    );
    req.flush({ bookingStatus: 'cancelled' });
  });

  // ── getMyBookings ─────────────────────────────────────────────────────────
  it('should fetch user bookings', () => {
    service.getMyBookings('u1').subscribe((bookings) => {
      expect(bookings.length).toBe(2);
    });

    const req = httpMock.expectOne((r) =>
      r.url.includes('/hotel-bookings?userId=u1'),
    );
    req.flush([{ _id: 'b1' }, { _id: 'b2' }]);
  });
});
