import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { HotelFilterFormComponent } from './hotel-filter-form.component';

describe('HotelFilterFormComponent', () => {
  let component: HotelFilterFormComponent;
  let fixture: ComponentFixture<HotelFilterFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelFilterFormComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelFilterFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default maxPrice of 20000', () => {
    expect(component.maxPrice).toBe(20000);
  });

  it('should have no star rating selected initially', () => {
    expect(component.selectedStar).toBeNull();
  });

  it('should have empty amenities selection initially', () => {
    expect(component.selectedAmenities.length).toBe(0);
  });

  it('should have empty hotel types selection initially', () => {
    expect(component.selectedHotelTypes.length).toBe(0);
  });

  it('should toggle amenity on and off', () => {
    spyOn(component.filterChanged, 'emit');
    component.toggleAmenity('WiFi');
    expect(component.selectedAmenities).toContain('WiFi');
    expect(component.filterChanged.emit).toHaveBeenCalled();

    component.toggleAmenity('WiFi');
    expect(component.selectedAmenities).not.toContain('WiFi');
  });

  it('should toggle hotel type on and off', () => {
    spyOn(component.filterChanged, 'emit');
    component.toggleHotelType('luxury');
    expect(component.selectedHotelTypes).toContain('luxury');

    component.toggleHotelType('luxury');
    expect(component.selectedHotelTypes).not.toContain('luxury');
  });

  it('should emit filter on onFilterChange', () => {
    spyOn(component.filterChanged, 'emit');
    component.maxPrice = 10000;
    component.selectedStar = 4;
    component.onFilterChange();

    expect(component.filterChanged.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ maxPrice: 10000, starRating: 4 }),
    );
  });

  it('should show only 4 amenities when showAllAmenities is false', () => {
    component.amenities = ['a', 'b', 'c', 'd', 'e', 'f'];
    component.showAllAmenities = false;
    expect(component.visibleAmenities.length).toBe(4);
  });

  it('should show all amenities when showAllAmenities is true', () => {
    component.amenities = ['a', 'b', 'c', 'd', 'e', 'f'];
    component.showAllAmenities = true;
    expect(component.visibleAmenities.length).toBe(6);
  });

  it('should restore filter from savedFilter input', () => {
    component.savedFilter = {
      maxPrice: 8000,
      starRating: 3,
      amenities: ['Pool'],
      hotelTypes: ['resort'],
      searchText: 'beach',
    };
    component.ngOnChanges({
      savedFilter: { currentValue: component.savedFilter } as any,
    });

    expect(component.maxPrice).toBe(8000);
    expect(component.selectedStar).toBe(3);
    expect(component.selectedAmenities).toEqual(['Pool']);
    expect(component.searchText).toBe('beach');
  });
});
