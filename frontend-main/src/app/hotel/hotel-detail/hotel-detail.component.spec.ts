import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { HotelDetailComponent } from './hotel-detail.component';

describe('HotelDetailComponent', () => {
  let component: HotelDetailComponent;
  let fixture: ComponentFixture<HotelDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HotelDetailComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have loading true initially', () => {
    expect(component.loading).toBeTrue();
  });

  it('should have no hotel initially', () => {
    expect(component.hotels).toBeNull();
  });

  it('should have default quantity of 1', () => {
    expect(component.selectedQuantity).toBe(1);
  });

  it('should have no selected plan initially', () => {
    expect(component.selectedPlan).toBeNull();
  });

  it('should have no selected room type initially', () => {
    expect(component.selectedType).toBeNull();
  });

  it('should have today as minimum date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(component.today).toBe(today);
  });

  it('should have no coupon initially unless passed via state', () => {
    expect(component.hasCoupon).toBeFalse();
    expect(component.couponCode).toBe('');
  });

  it('should have zero amounts initially', () => {
    expect(component.baseAmount).toBe(0);
    expect(component.taxAmount).toBe(0);
    expect(component.totalAmount).toBe(0);
  });

  it('should default guests to 1 and children/infants to 0', () => {
    expect(component.guests).toBe(1);
    expect(component.children).toBe(0);
    expect(component.infants).toBe(0);
  });
});
