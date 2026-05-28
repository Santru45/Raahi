import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { LoyaltyService } from './loyalty-service';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LoyaltyService],
    });
    service = TestBed.inject(LoyaltyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have null coinBalance initially', () => {
    expect(service.coinBalance()).toBeNull();
  });

  // ── refreshCoinBalance ────────────────────────────────────────────────────
  it('should set coinBalance from API on refresh', () => {
    service.refreshCoinBalance('user1');

    const req = httpMock.expectOne((r) => r.url.includes('/loyalty/user1'));
    req.flush({ coinBalance: 500, totalEarned: 800, tier: 'Silver' });

    expect(service.coinBalance()).toBe(500);
  });

  it('should set coinBalance to 0 on refresh error', () => {
    service.refreshCoinBalance('user1');

    const req = httpMock.expectOne((r) => r.url.includes('/loyalty/user1'));
    req.flush(null, { status: 404, statusText: 'Not Found' });

    expect(service.coinBalance()).toBe(0);
  });

  // ── getByUserId ───────────────────────────────────────────────────────────
  it('should fetch loyalty account by userId', () => {
    const mockAccount = { _id: 'l1', userId: 'u1', coinBalance: 200 };
    service.getByUserId('u1').subscribe((acc) => {
      expect(acc.coinBalance).toBe(200);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/loyalty/u1'));
    req.flush(mockAccount);
  });

  // ── cleanExpiredCoins ─────────────────────────────────────────────────────

  // ── awardCoins (tap updates signal) ───────────────────────────────────────
  it('should award coins and update coinBalance signal via tap', () => {
    service.awardCoins('u1', 5000, 'REF-001', 'hotel').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.includes('/loyalty/u1/award') && r.method === 'POST',
    );
    req.flush({ coinBalance: 50, totalEarned: 50 });

    expect(service.coinBalance()).toBe(50);
  });

  // ── validateRedeem ────────────────────────────────────────────────────────
  it('should validate redeem request', () => {
    service.validateRedeem('u1', 100, 5000).subscribe((res) => {
      expect(res.valid).toBeTrue();
      expect(res.maxAllowed).toBe(100);
    });

    const req = httpMock.expectOne((r) =>
      r.url.includes('/loyalty/u1/validate-redeem'),
    );
    req.flush({ valid: true, maxAllowed: 100, discountAmount: 100 });
  });
});
