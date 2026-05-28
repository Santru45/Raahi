import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RecommendService } from './recommend.service';

describe('RecommendService', () => {
  let service: RecommendService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RecommendService],
    });
    service = TestBed.inject(RecommendService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch recommendations without params', () => {
    service.getRecommendation().subscribe((items) => {
      expect(items.length).toBe(2);
    });

    const req = httpMock.expectOne(
      (r) => r.url.includes('/recommendations') && !r.url.includes('?'),
    );
    req.flush([{ kind: 'hotel' }, { kind: 'offer' }]);
  });

  it('should include userId and location query params', () => {
    service.getRecommendation('u1', 'Delhi').subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url.includes('/recommendations?') &&
        r.url.includes('userId=u1') &&
        r.url.includes('location=Delhi'),
    );
    req.flush([]);
  });

  it('should fetch offer with hotels', () => {
    service.getOfferWithHotels('o1').subscribe((result) => {
      expect(result.offer).toBeTruthy();
      expect(result.hotels.length).toBe(1);
    });

    const req = httpMock.expectOne((r) =>
      r.url.includes('/recommendations/offer/o1'),
    );
    req.flush({
      offer: { _id: 'o1', code: 'DEAL' },
      hotels: [{ _id: 'h1' }],
    });
  });

  it('should fetch hotel by id and normalize ids', () => {
    service.getHotelById('h1').subscribe((hotels) => {
      expect(hotels[0].id).toBeTruthy();
    });

    const req = httpMock.expectOne((r) =>
      r.url.includes('/recommendations/hotel/h1'),
    );
    req.flush([{ _id: 'h1', name: 'Hotel X' }]);
  });
});
