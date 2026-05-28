import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TravelSearchComponent } from './travel-search.component';
import { TransportService } from '../../travel.service';
import { TravelDAO } from '../../travel.dao';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { of, throwError } from 'rxjs';

describe('TravelSearchComponent', () => {
  let fixture: ComponentFixture<TravelSearchComponent>;
  let component: TravelSearchComponent;
  let transportService: jasmine.SpyObj<TransportService>;
  let travelDao: jasmine.SpyObj<TravelDAO>;
  let router: jasmine.SpyObj<Router>;

  const selectedMode = signal<'flight' | 'train' | 'bus'>('flight');
  const searchOrigin = signal('');
  const searchDestination = signal('');
  const searchDate = signal('');
  const searchCabinClass = signal('');
  const passengerCount = signal(1);
  const availableTrips = signal<any[]>([]);
  const selectedTrip = signal<any>(null);

  beforeEach(async () => {
    transportService = jasmine.createSpyObj(
      'TransportService',
      ['restoreSearchResults', 'saveSearchResults'],
      {
        selectedMode,
        searchOrigin,
        searchDestination,
        searchDate,
        searchCabinClass,
        passengerCount,
        availableTrips,
        selectedTrip,
      },
    );

    travelDao = jasmine.createSpyObj('TravelDAO', [
      'searchLocations',
      'getServices',
    ]);
    travelDao.searchLocations.and.returnValue(of([]));
    travelDao.getServices.and.returnValue(of([]));

    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [TravelSearchComponent, ReactiveFormsModule],
      providers: [
        { provide: TransportService, useValue: transportService },
        { provide: TravelDAO, useValue: travelDao },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TravelSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should build searchForm on init', () =>
    expect(component.searchForm).toBeDefined());

  it('should call restoreSearchResults on init', () =>
    expect(transportService.restoreSearchResults).toHaveBeenCalled());

  it('should set selectedMode signal when selectMode is called', () => {
    component.selectMode('train');
    expect(selectedMode()).toBe('train');
  });

  it('should reset form when selectMode is called', () => {
    component.searchForm.patchValue({ origin: 'Delhi' });
    component.selectMode('bus');
    expect(component.searchForm.get('origin')?.value).toBe('');
  });

  it('should fetch origin suggestions when input >= 2 chars', () => {
    travelDao.searchLocations.and.returnValue(of([{ city: 'Mumbai' }] as any));
    const event = { target: { value: 'Mu' } } as unknown as Event;
    component.onOriginInput(event);
    expect(travelDao.searchLocations).toHaveBeenCalledWith('flight', 'Mu');
    expect(component.originSuggestions.length).toBe(1);
  });

  it('should clear origin suggestions when input < 2 chars', () => {
    component.originSuggestions = [{ city: 'x' } as any];
    const event = { target: { value: 'M' } } as unknown as Event;
    component.onOriginInput(event);
    expect(component.originSuggestions.length).toBe(0);
  });

  it('should fetch destination suggestions', () => {
    travelDao.searchLocations.and.returnValue(of([{ city: 'Goa' }] as any));
    const event = { target: { value: 'Go' } } as unknown as Event;
    component.onDestInput(event);
    expect(component.destSuggestions.length).toBe(1);
  });

  it('should set origin form value when selectOrigin is called', () => {
    component.selectOrigin({ city: 'Delhi' } as any);
    expect(component.searchForm.get('origin')?.value).toBe('Delhi');
    expect(component.originSuggestions.length).toBe(0);
  });

  it('should set destination form value when selectDest is called', () => {
    component.selectDest({ city: 'Goa' } as any);
    expect(component.searchForm.get('destination')?.value).toBe('Goa');
  });

  it('should increment passengers up to 9', () => {
    component.searchForm.patchValue({ passengers: 8 });
    component.incrementPassengers();
    expect(component.searchForm.get('passengers')?.value).toBe(9);
    component.incrementPassengers();
    expect(component.searchForm.get('passengers')?.value).toBe(9);
  });

  it('should decrement passengers down to 1', () => {
    component.searchForm.patchValue({ passengers: 2 });
    component.decrementPassengers();
    expect(component.searchForm.get('passengers')?.value).toBe(1);
    component.decrementPassengers();
    expect(component.searchForm.get('passengers')?.value).toBe(1);
  });

  it('should set sameRouteError when origin equals destination', () => {
    component.searchForm.patchValue({
      origin: 'Delhi',
      destination: 'Delhi',
      date: new Date().toISOString().split('T')[0],
      passengers: 1,
    });
    component.onSearch();
    expect(component.sameRouteError).toBeTrue();
  });

  it('should navigate to results on successful search', () => {
    const mockTrip = {
      schedule: {
        departureTime: new Date(Date.now() + 86400000).toISOString(),
      },
    };
    travelDao.getServices.and.returnValue(of([mockTrip] as any));
    component.searchForm.patchValue({
      origin: 'Mumbai',
      destination: 'Delhi',
      date: new Date().toISOString().split('T')[0],
      passengers: 1,
    });
    component.onSearch();
    expect(router.navigate).toHaveBeenCalledWith(['/travel/results']);
  });

  it('should mark form touched if invalid on search', () => {
    spyOn(component.searchForm, 'markAllAsTouched');
    component.onSearch();
    expect(component.searchForm.markAllAsTouched).toHaveBeenCalled();
  });
});
