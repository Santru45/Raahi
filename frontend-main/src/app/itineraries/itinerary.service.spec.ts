import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ItineraryService } from './itinerary.service';

describe('ItineraryService', () => {
  let service: ItineraryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ItineraryService],
    });
    service = TestBed.inject(ItineraryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getItineraries ────────────────────────────────────────────────────────
  it('should fetch all itineraries', () => {
    const mockData = [
      { _id: '1', trip_name: 'Trip A', type: 'std' },
      { _id: '2', trip_name: 'Trip B', type: 'custom' },
    ];

    service.getItineraries().subscribe((data) => {
      expect(data.length).toBe(2);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/itineraries'));
    req.flush(mockData);
  });

  // ── createItinerary ───────────────────────────────────────────────────────
  it('should create a new itinerary', () => {
    const formValue = { trip_name: 'My Trip', destination: 'Goa' };

    service.createItinerary(formValue, 'user1').subscribe((res) => {
      expect(res.trip_name).toBe('My Trip');
    });

    const req = httpMock.expectOne(
      (r) => r.url.includes('/itineraries') && r.method === 'POST',
    );
    expect(req.request.body.user_id).toBe('user1');
    expect(req.request.body.trip_name).toBe('My Trip');
    expect(req.request.body.type).toBe('custom');
    req.flush({ _id: '3', trip_name: 'My Trip' });
  });

  it('should use default image when image_url not provided', () => {
    service.createItinerary({ trip_name: 'No Image' }, 'u1').subscribe();

    const req = httpMock.expectOne((r) => r.method === 'POST');
    expect(req.request.body.images[0]).toContain('unsplash.com');
    req.flush({});
  });

  // ── deleteItinerary ───────────────────────────────────────────────────────
  it('should delete an itinerary', () => {
    service.deleteItinerary('1').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.includes('/itineraries/1') && r.method === 'DELETE',
    );
    req.flush(null);
  });

  // ── patchTrip ─────────────────────────────────────────────────────────────
  it('should patch trip name', () => {
    service.patchTrip('1', { trip_name: 'Updated' }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.includes('/itineraries/1') && r.method === 'PATCH',
    );
    expect(req.request.body.trip_name).toBe('Updated');
    req.flush({});
  });

  // ── getItemsForTrip ───────────────────────────────────────────────────────
  it('should fetch and filter items for a trip', () => {
    const allItems = [
      { _id: 'i1', itinerary_id: '1', title: 'Item A', date: '2025-01-02' },
      { _id: 'i2', itinerary_id: '2', title: 'Item B', date: '2025-01-01' },
      { _id: 'i3', itinerary_id: '1', title: 'Item C', date: '2025-01-01' },
    ];

    service.getItemsForTrip('1').subscribe((items) => {
      expect(items.length).toBe(2);
      // Sorted by date — Item C before Item A
      expect(items[0].title).toBe('Item C');
      expect(items[1].title).toBe('Item A');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/itinerary-items'));
    req.flush(allItems);
  });

  it('should sort std trip items by sort_order', () => {
    const allItems = [
      { _id: 'i1', itinerary_id: '1', sort_order: 2, date: '2025-01-01' },
      { _id: 'i2', itinerary_id: '1', sort_order: 1, date: '2025-01-02' },
    ];

    service.getItemsForTrip('1', 'std').subscribe((items) => {
      expect(items[0].sort_order).toBe(1);
      expect(items[1].sort_order).toBe(2);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/itinerary-items'));
    req.flush(allItems);
  });

  // ── addItem ───────────────────────────────────────────────────────────────
  it('should add an item to a trip', () => {
    service.addItem('1', { title: 'New Item' }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.includes('/itinerary-items') && r.method === 'POST',
    );
    expect(req.request.body.itinerary_id).toBe('1');
    req.flush({});
  });

  // ── deleteItem ────────────────────────────────────────────────────────────
  it('should delete an item', () => {
    service.deleteItem('i1').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.includes('/itinerary-items/i1') && r.method === 'DELETE',
    );
    req.flush(null);
  });

  // ── updateItineraryDates ──────────────────────────────────────────────────
  it('should patch dates based on item dates', () => {
    const items = [
      { date: '2025-03-10' },
      { date: '2025-03-15' },
      { date: '2025-03-12' },
    ];

    service.updateItineraryDates('1', items).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.includes('/itineraries/1') && r.method === 'PATCH',
    );
    expect(req.request.body.start_date).toBe('2025-03-10');
    expect(req.request.body.end_date).toBe('2025-03-15');
    req.flush({});
  });

  it('should set null dates when no items have dates', () => {
    service.updateItineraryDates('1', [{ date: null }]).subscribe();

    const req = httpMock.expectOne((r) => r.method === 'PATCH');
    expect(req.request.body.start_date).toBeNull();
    expect(req.request.body.end_date).toBeNull();
    req.flush({});
  });

  // ── exportToCalendar ──────────────────────────────────────────────────────
  it('should not export when items array is empty', () => {
    spyOn(console, 'warn');
    service.exportToCalendar([], 'Test Trip');
    expect(console.warn).toHaveBeenCalledWith('No plans to export!');
  });
});
