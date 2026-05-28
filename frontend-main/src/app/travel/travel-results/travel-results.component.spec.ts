import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TravelResultsComponent } from './travel-results.component';
import { TransportService } from '../travel.service';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';

describe('TravelResultsComponent', () => {
  let fixture: ComponentFixture<TravelResultsComponent>;
  let component: TravelResultsComponent;
  let transportService: jasmine.SpyObj<TransportService>;
  let router: jasmine.SpyObj<Router>;

  const availableTrips = signal<any[]>([]);
  const selectedTrip = signal<any>(null);
  const selectedMode = signal<'flight' | 'train' | 'bus'>('flight');

  beforeEach(async () => {
    transportService = jasmine.createSpyObj(
      'TransportService',
      ['restoreSearchResults'],
      {
        availableTrips,
        selectedTrip,
        selectedMode,
      },
    );

    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [TravelResultsComponent],
      providers: [
        { provide: TransportService, useValue: transportService },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TravelResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should call restoreSearchResults in constructor', () =>
    expect(transportService.restoreSearchResults).toHaveBeenCalled());

  it('should navigate to /travel on onModifySearch', () => {
    component.onModifySearch();
    expect(router.navigate).toHaveBeenCalledWith(['/travel']);
    expect(availableTrips()).toEqual([]);
    expect(selectedTrip()).toBeNull();
  });

  it('should set selectedTrip and navigate on onTripSelected', () => {
    const trip = { _id: '1', fare: 500 } as any;
    component.onTripSelected(trip);
    expect(selectedTrip()).toEqual(trip);
    expect(router.navigate).toHaveBeenCalledWith(['/travel/booking']);
  });

  it('should toggle operator filter', () => {
    component.toggleOperator('IndiGo');
    expect(component.selectedOperators().has('IndiGo')).toBeTrue();
    component.toggleOperator('IndiGo');
    expect(component.selectedOperators().has('IndiGo')).toBeFalse();
  });

  it('should toggle departure filter', () => {
    component.toggleDeparture('morning');
    expect(component.selectedDepartures().has('morning')).toBeTrue();
    component.toggleDeparture('morning');
    expect(component.selectedDepartures().has('morning')).toBeFalse();
  });

  it('should clear all filters', () => {
    component.sortBy.set('price-desc');
    component.selectedOperators.set(new Set(['IndiGo']));
    component.selectedDepartures.set(new Set(['morning']));
    component.clearFilters();
    expect(component.sortBy()).toBe('price-asc');
    expect(component.selectedOperators().size).toBe(0);
    expect(component.selectedDepartures().size).toBe(0);
  });

  it('should count active filters correctly', () => {
    component.sortBy.set('price-desc');
    component.selectedOperators.set(new Set(['IndiGo']));
    expect(component.activeFilterCount).toBe(2);
  });

  it('should compute operators from availableTrips', () => {
    availableTrips.set([
      {
        operatorName: 'IndiGo',
        fare: 3000,
        schedule: { departureTime: '' },
      } as any,
      {
        operatorName: 'Air India',
        fare: 4000,
        schedule: { departureTime: '' },
      } as any,
    ]);
    expect(component.operators()).toContain('IndiGo');
    expect(component.operators()).toContain('Air India');
  });

  it('should compute priceExtent from trips', () => {
    availableTrips.set([
      { operatorName: 'X', fare: 1000, schedule: { departureTime: '' } } as any,
      { operatorName: 'Y', fare: 5000, schedule: { departureTime: '' } } as any,
    ]);
    expect(component.priceExtent()).toEqual({ min: 1000, max: 5000 });
  });

  it('should return default priceExtent when no trips', () => {
    availableTrips.set([]);
    expect(component.priceExtent()).toEqual({ min: 0, max: 10000 });
  });
});
