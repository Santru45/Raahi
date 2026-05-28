import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { HotelListingComponent } from './hotel-listing.component';

describe('HotelListingComponent', () => {
  let component: HotelListingComponent;
  let fixture: ComponentFixture<HotelListingComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HotelListingComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelListingComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values for search params', () => {
    expect(component.rooms).toBe(1);
    expect(component.adults).toBe(1);
    expect(component.children).toBe(0);
    expect(component.infants).toBe(0);
  });

  it('should calculate totalGuests excluding infants', () => {
    component.adults = 2;
    component.children = 1;
    component.infants = 1;
    expect(component.totalGuests).toBe(3);
  });

  it('should calculate total starting price for requested rooms', () => {
    component.rooms = 2;
    component.roomPriceMap = { h1: 3000 };
    const hotel = { _id: 'h1' } as any;
    expect(component.getTotalStartingPrice(hotel)).toBe(6000);
  });

  it('should return 0 price when hotel not in priceMap', () => {
    component.rooms = 1;
    component.roomPriceMap = {};
    const hotel = { _id: 'h99' } as any;
    expect(component.getTotalStartingPrice(hotel)).toBe(0);
  });

  it('should navigate to hotel detail with query params', () => {
    spyOn(router, 'navigate');
    component.checkIn = '2025-06-01';
    component.checkOut = '2025-06-03';
    component.rooms = 1;
    component.adults = 2;
    component.children = 0;
    component.infants = 0;

    component.viewDetail({ _id: 'h1' } as any);

    expect(router.navigate).toHaveBeenCalledWith(['/hotel', 'h1'], {
      queryParams: {
        checkIn: '2025-06-01',
        checkOut: '2025-06-03',
        rooms: 1,
        adults: 2,
        children: 0,
        infants: 0,
      },
    });
  });
});
