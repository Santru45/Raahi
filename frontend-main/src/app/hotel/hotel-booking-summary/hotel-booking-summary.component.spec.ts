import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { HotelBookingSummaryComponent } from './hotel-booking-summary.component';

describe('HotelBookingSummaryComponent', () => {
  let component: HotelBookingSummaryComponent;
  let fixture: ComponentFixture<HotelBookingSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HotelBookingSummaryComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelBookingSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty rooms initially', () => {
    expect(component.rooms.length).toBe(0);
    expect(component.roomCount).toBe(0);
  });

  it('should default to wallet payment', () => {
    expect(component.selectedPayment).toBe('wallet');
  });

  it('should have isLoadingLoyalty property defined', () => {
    expect(component.isLoadingLoyalty).toBeDefined();
  });

  it('should have zero coins to redeem initially', () => {
    expect(component.coinsToRedeem).toBe(0);
  });

  it('should have no coupon initially', () => {
    expect(component.hasCoupon).toBeFalse();
    expect(component.couponCode).toBe('');
  });

  it('should have default guest title Mr', () => {
    expect(component.guestTitle).toBe('Mr');
  });

  it('should return empty string for roomType when no rooms', () => {
    expect(component.roomType).toBe('');
  });

  it('should return empty array for roomImages when no rooms', () => {
    expect(component.roomImages).toEqual([]);
  });

  it('should return roomType from first room', () => {
    component.rooms = [{ roomType: 'Deluxe', bedType: 'King' } as any];
    expect(component.roomType).toBe('Deluxe');
    expect(component.bedType).toBe('King');
  });
});
