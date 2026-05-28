import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { HotelSearchComponent } from './hotel-search.component';

describe('HotelSearchComponent', () => {
  let component: HotelSearchComponent;
  let fixture: ComponentFixture<HotelSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HotelSearchComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the search form with default values', () => {
    expect(component.searchForm).toBeTruthy();
    expect(component.searchForm.get('destination')?.value).toBe('');
    expect(component.searchForm.get('rooms')?.value).toBe(1);
    expect(component.searchForm.get('adults')?.value).toBe(1);
    expect(component.searchForm.get('children')?.value).toBe(0);
    expect(component.searchForm.get('infants')?.value).toBe(0);
  });

  it('should require destination', () => {
    component.searchForm.get('destination')?.setValue('');
    expect(component.searchForm.get('destination')?.valid).toBeFalse();
  });

  it('should accept valid destination', () => {
    component.searchForm.get('destination')?.setValue('Delhi');
    expect(component.searchForm.get('destination')?.valid).toBeTrue();
  });

  it('should reject destination with numbers', () => {
    component.searchForm.get('destination')?.setValue('Delhi123');
    expect(
      component.searchForm.get('destination')?.hasError('pattern'),
    ).toBeTrue();
  });

  it('should not show results initially', () => {
    expect(component.showResults).toBeFalse();
  });

  it('should not show filter initially', () => {
    expect(component.showFilter).toBeFalse();
  });

  it('should have today as the minimum date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(component.today).toBe(today);
  });

  it('should have default filter values', () => {
    expect(component.savedFilter.maxPrice).toBe(20000);
    expect(component.savedFilter.starRating).toBeNull();
    expect(component.savedFilter.amenities.length).toBe(0);
    expect(component.savedFilter.hotelTypes.length).toBe(0);
  });

  // --- closeGuestPicker ---
  it('closeGuestPicker should hide guest picker', () => {
    component.showGuestPicker = true;
    component.closeGuestPicker();
    expect(component.showGuestPicker).toBeFalse();
  });

  // --- toggleGuestPicker ---
  it('toggleGuestPicker should toggle showGuestPicker', () => {
    component.showGuestPicker = false;
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    component.toggleGuestPicker(event);
    expect(component.showGuestPicker).toBeTrue();
    component.toggleGuestPicker(event);
    expect(component.showGuestPicker).toBeFalse();
  });

  // --- minCheckOut ---
  it('minCheckOut should return a date string when checkIn is set', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    component.searchForm.get('checkIn')?.setValue(tomorrow);
    expect(component.minCheckOut).toBeTruthy();
    expect(component.minCheckOut).not.toBe(component.today);
  });

  it('minCheckOut should return today when checkIn is not set', () => {
    component.searchForm.get('checkIn')?.setValue('');
    expect(component.minCheckOut).toBe(component.today);
  });

  // --- onCheckInChange ---
  it('onCheckInChange should set maxCheckOut', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    component.searchForm.get('checkIn')?.setValue(tomorrow);
    component.onCheckInChange();
    expect(component.maxCheckOut).toBeTruthy();
  });

  // --- changeGuest ---
  it('changeGuest should increment adults', () => {
    component.searchForm.patchValue({ adults: 1, rooms: 1 });
    component.changeGuest('adults', 1);
    expect(component.searchForm.get('adults')?.value).toBe(2);
  });

  it('changeGuest should not go below minimum for adults', () => {
    component.searchForm.patchValue({ adults: 1, rooms: 1 });
    component.changeGuest('adults', -1);
    expect(component.searchForm.get('adults')?.value).toBe(1);
  });

  it('changeGuest should increment children', () => {
    component.searchForm.patchValue({ children: 0 });
    component.changeGuest('children', 1);
    expect(component.searchForm.get('children')?.value).toBe(1);
  });

  it('changeGuest should not go below 0 for children', () => {
    component.searchForm.patchValue({ children: 0 });
    component.changeGuest('children', -1);
    expect(component.searchForm.get('children')?.value).toBe(0);
  });
});

describe('HotelSearchComponent', () => {
  let component: HotelSearchComponent;
  let fixture: ComponentFixture<HotelSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HotelSearchComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the search form with default values', () => {
    expect(component.searchForm).toBeTruthy();
    expect(component.searchForm.get('destination')?.value).toBe('');
    expect(component.searchForm.get('rooms')?.value).toBe(1);
    expect(component.searchForm.get('adults')?.value).toBe(1);
    expect(component.searchForm.get('children')?.value).toBe(0);
    expect(component.searchForm.get('infants')?.value).toBe(0);
  });

  it('should require destination', () => {
    component.searchForm.get('destination')?.setValue('');
    expect(component.searchForm.get('destination')?.valid).toBeFalse();
  });

  it('should accept valid destination', () => {
    component.searchForm.get('destination')?.setValue('Delhi');
    expect(component.searchForm.get('destination')?.valid).toBeTrue();
  });

  it('should reject destination with numbers', () => {
    component.searchForm.get('destination')?.setValue('Delhi123');
    expect(
      component.searchForm.get('destination')?.hasError('pattern'),
    ).toBeTrue();
  });

  it('should not show results initially', () => {
    expect(component.showResults).toBeFalse();
  });

  it('should not show filter initially', () => {
    expect(component.showFilter).toBeFalse();
  });

  it('should have today as the minimum date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(component.today).toBe(today);
  });

  it('should have default filter values', () => {
    expect(component.savedFilter.maxPrice).toBe(20000);
    expect(component.savedFilter.starRating).toBeNull();
    expect(component.savedFilter.amenities.length).toBe(0);
    expect(component.savedFilter.hotelTypes.length).toBe(0);
  });
});
