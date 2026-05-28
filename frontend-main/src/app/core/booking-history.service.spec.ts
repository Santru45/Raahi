import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { BookingHistoryService } from './booking-history.service';

describe('BookingHistoryService', () => {
  let service: BookingHistoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BookingHistoryService],
    });
    service = TestBed.inject(BookingHistoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch combined and sorted booking history from backend', () => {
    const mockBookings = [
      {
        bookingReference: 'HB-002',
        type: 'hotel',
        destination: 'Hotel A',
        startDate: '2024-06-01',
        endDate: '2024-06-03',
        status: 'completed',
        bookedAt: '2024-05-01',
      },
      {
        bookingReference: 'HB-001',
        type: 'hotel',
        destination: 'Hotel A',
        startDate: '2024-01-01',
        endDate: '2024-01-03',
        status: 'completed',
        bookedAt: '2023-12-01',
      },
    ];

    service.getBookingHistory('u1').subscribe((bookings) => {
      expect(bookings.length).toBe(2);
      expect(bookings[0].bookingReference).toBe('HB-002');
      expect(bookings[0].type).toBe('hotel');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/bookings/user/u1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockBookings);
  });

  it('should handle cancelled bookings correctly', () => {
    service.getBookingHistory('u1').subscribe((bookings) => {
      expect(bookings[0].status).toBe('cancelled');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/bookings/user/u1'));
    req.flush([
      {
        bookingReference: 'HB-C',
        type: 'hotel',
        destination: 'Hotel X',
        startDate: '2025-12-01',
        endDate: '2025-12-03',
        status: 'cancelled',
        bookedAt: '2025-11-01',
      },
    ]);
  });

  it('should handle API errors gracefully', () => {
    service.getBookingHistory('u1').subscribe({
      error: (err) => {
        expect(err).toBeTruthy();
      },
    });

    const req = httpMock.expectOne((r) => r.url.includes('/bookings/user/u1'));
    req.flush(null, { status: 500, statusText: 'Error' });
  });
});
