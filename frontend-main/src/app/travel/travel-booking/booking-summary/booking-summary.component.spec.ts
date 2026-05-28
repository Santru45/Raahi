import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingSummaryComponent } from './booking-summary.component';
import { TransportService } from '../../travel.service';
import { AuthService } from '../../../auth/auth.service';
import { LoyaltyService } from '../../../profile/loyalty/loyalty-service';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { of } from 'rxjs';

const mockTrip: any = {
  _id: 'trip1',
  type: 'flight',
  from: 'Mumbai',
  to: 'Delhi',
  fare: 3000,
  marketRate: 4000,
  taxPercent: 5,
  operatorName: 'IndiGo',
  schedule: { departureTime: '2026-06-01T06:00:00.000Z' },
};

const mockPassengers = [{ firstName: 'John', lastName: 'Doe' }];

const mockLoyaltyAccount: any = {
  coinBalance: 500,
  maxRedeemPercent: 10,
  earnMultiplier: 1,
};

describe('BookingSummaryComponent', () => {
  let fixture: ComponentFixture<BookingSummaryComponent>;
  let component: BookingSummaryComponent;
  let transportService: jasmine.SpyObj<TransportService>;
  let authService: jasmine.SpyObj<AuthService>;
  let loyaltyService: jasmine.SpyObj<LoyaltyService>;
  let router: jasmine.SpyObj<Router>;

  const selectedTrip = signal<any>(mockTrip);
  const passengerData = signal<any[]>(mockPassengers);
  const walletBalance = signal(5000);

  beforeEach(async () => {
    transportService = jasmine.createSpyObj(
      'TransportService',
      [
        'restoreBookingStateFromStorage',
        'loadWallet',
        'processBooking',
        'deductFromWallet',
        'clearBookingState',
      ],
      {
        selectedTrip,
        passengerData,
        walletBalance,
      },
    );
    transportService.loadWallet.and.returnValue(Promise.resolve());

    authService = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    authService.getCurrentUser.and.returnValue({
      _id: 'user1',
      email: 'a@b.com',
    } as any);

    loyaltyService = jasmine.createSpyObj(
      'LoyaltyService',
      ['validateRedeem', 'redeemCoins', 'awardCoins', 'calculateCoins'],
      {
        loyaltyAccount: signal(mockLoyaltyAccount),
      },
    );
    loyaltyService.validateRedeem.and.returnValue(
      of({ valid: true, discountAmount: 50, maxAllowed: 100, error: '' }),
    );
    loyaltyService.redeemCoins.and.returnValue(
      of({ account: mockLoyaltyAccount, discountAmount: 50 }),
    );
    loyaltyService.awardCoins.and.returnValue(of(mockLoyaltyAccount));
    loyaltyService.calculateCoins.and.returnValue(30);

    router = jasmine.createSpyObj('Router', ['navigate'], {
      url: '/travel/booking',
    });

    await TestBed.configureTestingModule({
      imports: [BookingSummaryComponent],
      providers: [
        { provide: TransportService, useValue: transportService },
        { provide: AuthService, useValue: authService },
        { provide: LoyaltyService, useValue: loyaltyService },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should call restoreBookingStateFromStorage on init', () =>
    expect(transportService.restoreBookingStateFromStorage).toHaveBeenCalled());

  it('should load wallet on init when user is logged in', () =>
    expect(transportService.loadWallet).toHaveBeenCalledWith('user1'));

  it('should set isLoggedIn true when user exists', () =>
    expect(component.isLoggedIn).toBeTrue());

  it('should compute pricing correctly', () => {
    const pricing = component.pricing!;
    expect(pricing.baseAmount).toBe(3000);
    expect(pricing.taxAmount).toBeCloseTo(150, 1);
    expect(pricing.subtotal).toBeCloseTo(3150, 1);
    expect(pricing.savings).toBe(1000);
  });

  it('should return walletBalance from service', () =>
    expect(component.walletBalance).toBe(5000));

  it('should return insufficientBalance false when wallet covers total', () =>
    expect(component.insufficientBalance).toBeFalse());

  it('should return insufficientBalance true when wallet is too low', () => {
    walletBalance.set(10);
    expect(component.insufficientBalance).toBeTrue();
    walletBalance.set(5000);
  });

  it('should select enabled payment method', () => {
    component.selectPayment('razorpay');
    expect(component.selectedPayment).toBe('razorpay');
  });

  it('should set paymentMessage for disabled payment method', () => {
    component.selectPayment('upi');
    expect(component.paymentMessage).toContain('soon');
  });

  it('should navigate to login on goToLogin', () => {
    component.goToLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should navigate to signup on goToSignup', () => {
    component.goToSignup();
    expect(router.navigate).toHaveBeenCalledWith(['/signup']);
  });

  it('should set coinsToRedeem to max on useMaxCoins', () => {
    component.maxRedeemableCoins = 100;
    component.useMaxCoins();
    expect(component.coinsToRedeem).toBe(100);
  });

  it('should reset coins on removeCoins', () => {
    component.coinsToRedeem = 50;
    component.removeCoins();
    expect(component.coinsToRedeem).toBe(0);
    expect(component.redeemValidation).toBeNull();
  });

  it('should return coinsEarnedFromBooking', () => {
    const earned = component.coinsEarnedFromBooking;
    expect(loyaltyService.calculateCoins).toHaveBeenCalled();
    expect(earned).toBe(30);
  });

  it('should return loyaltyAccount from service', () =>
    expect(component.loyaltyAccount).toEqual(mockLoyaltyAccount));

  it('should redirect to login if not logged in on onConfirmBooking', async () => {
    component.isLoggedIn = false;
    await component.onConfirmBooking();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should set paymentState to processing on wallet booking', async () => {
    transportService.processBooking.and.returnValue(
      Promise.resolve({ bookingReference: 'REF1', ticketId: 'T1' } as any),
    );
    transportService.deductFromWallet.and.returnValue(Promise.resolve());
    transportService.clearBookingState.and.stub();
    spyOn(window, 'scrollTo').and.stub();

    component.selectedPayment = 'wallet';
    component.isLoggedIn = true;
    await component.onConfirmBooking();
    expect(transportService.processBooking).toHaveBeenCalled();
  });
});
