import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { StatsService } from './stats.service';

describe('StatsService', () => {
  let service: StatsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StatsService],
    });
    service = TestBed.inject(StatsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch dashboard stats from backend', () => {
    const mockStats = {
      totalUsers: 2,
      totalBookings: 2,
      totalCustomers: 1,
      totalAdmins: 1,
      revenue: 15000,
      hotelRevenue: 5000,
      cancellationRate: 50,
      hotelBookings: 1,
      flightBookings: 1,
      activeUsers: 2,
      flightRevenue: 10000,
      trainRevenue: 0,
      users: [{ _id: 'u1', name: 'User', role: 'customer', isActive: true }],
      avgBookingsPerCustomer: 2,
    };

    service.getDashBoardStats().subscribe((stats) => {
      expect(stats.totalUsers).toBe(2);
      expect(stats.totalBookings).toBe(2);
      expect(stats.totalCustomers).toBe(1);
      expect(stats.totalAdmins).toBe(1);
      expect(stats.revenue).toBe(15000);
      expect(stats.hotelRevenue).toBe(5000);
      expect(stats.cancellationRate).toBe(50);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/admin/stats'));
    expect(req.request.method).toBe('GET');
    req.flush(mockStats);
  });

  it('should fetch top hotels from backend', () => {
    const mockTopHotels = [
      { name: 'Hotel A', starRating: 4, bookingCount: 2, revenue: 8000 },
    ];

    service.getTopHotels().subscribe((hotels) => {
      expect(hotels.length).toBe(1);
      expect(hotels[0].name).toBe('Hotel A');
      expect(hotels[0].revenue).toBe(8000);
      expect(hotels[0].bookingCount).toBe(2);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/admin/top-hotels'));
    expect(req.request.method).toBe('GET');
    req.flush(mockTopHotels);
  });

  it('should fetch recent bookings from backend', () => {
    const mockBookings = [
      {
        bookingReference: 'HB-001',
        type: 'hotel',
        destination: 'Mumbai',
        amount: 5000,
        bookingStatus: 'confirmed',
        bookedAt: '2025-01-01',
        userName: 'User A',
        userId: 'u1',
      },
    ];

    service.getRecentBookings().subscribe((bookings) => {
      expect(bookings.length).toBe(1);
      expect(bookings[0].type).toBe('hotel');
    });

    const req = httpMock.expectOne((r) =>
      r.url.includes('/admin/recent-bookings'),
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockBookings);
  });
});
