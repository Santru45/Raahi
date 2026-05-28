import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TravelBookingComponent } from './travel-booking.component';
import { TransportService } from '../travel.service';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';

describe('TravelBookingComponent', () => {
  let fixture: ComponentFixture<TravelBookingComponent>;
  let component: TravelBookingComponent;
  let transportService: jasmine.SpyObj<TransportService>;
  let router: jasmine.SpyObj<Router>;

  const selectedMode = signal<'flight' | 'train' | 'bus'>('flight');
  const passengerData = signal<any[]>([]);
  const selectedTrip = signal<any>(null);
  const selectedSeat = signal<any>(null);

  beforeEach(async () => {
    transportService = jasmine.createSpyObj(
      'TransportService',
      ['saveBookingStateToStorage'],
      {
        selectedMode,
        passengerData,
        selectedTrip,
        selectedSeat,
      },
    );

    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [TravelBookingComponent],
      providers: [
        { provide: TransportService, useValue: transportService },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TravelBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should start at seat step for flight mode', () => {
    expect(component.currentStep()).toBe('seat');
  });

  it('should start at passenger step for train mode', async () => {
    await TestBed.resetTestingModule();
    const trainMode = signal<'flight' | 'train' | 'bus'>('train');
    const ts = jasmine.createSpyObj('TransportService', [], {
      selectedMode: trainMode,
      passengerData: signal([]),
      selectedTrip: signal(null),
      selectedSeat: signal(null),
    });

    await TestBed.configureTestingModule({
      imports: [TravelBookingComponent],
      providers: [
        { provide: TransportService, useValue: ts },
        {
          provide: Router,
          useValue: jasmine.createSpyObj('Router', ['navigate']),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    const f = TestBed.createComponent(TravelBookingComponent);
    f.detectChanges();
    expect(f.componentInstance.currentStep()).toBe('passenger');
  });

  it('should jump to summary on init if passengerData exists', async () => {
    await TestBed.resetTestingModule();
    const ts = jasmine.createSpyObj('TransportService', [], {
      selectedMode: signal<'flight' | 'train' | 'bus'>('flight'),
      passengerData: signal([{ firstName: 'John' }]),
      selectedTrip: signal(null),
      selectedSeat: signal(null),
    });

    await TestBed.configureTestingModule({
      imports: [TravelBookingComponent],
      providers: [
        { provide: TransportService, useValue: ts },
        {
          provide: Router,
          useValue: jasmine.createSpyObj('Router', ['navigate']),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    const f = TestBed.createComponent(TravelBookingComponent);
    f.detectChanges();
    expect(f.componentInstance.currentStep()).toBe('summary');
  });

  it('should move to boarding step on onSeatConfirmed for bus', async () => {
    selectedMode.set('bus');
    component.onSeatConfirmed(['1A']);
    expect(component.currentStep()).toBe('boarding');
  });

  it('should move to passenger step on onSeatConfirmed for flight', () => {
    selectedMode.set('flight');
    component.onSeatConfirmed(['1A']);
    expect(component.currentStep()).toBe('passenger');
  });

  it('should move to passenger step on onPointsConfirmed', () => {
    component.onPointsConfirmed({ boarding: 'A', dropping: 'B' });
    expect(component.currentStep()).toBe('passenger');
  });

  it('should move to summary on onPassengersSubmitted', () => {
    component.onPassengersSubmitted();
    expect(component.currentStep()).toBe('summary');
  });

  it('should navigate to results and clear trip on onBackToResults', () => {
    component.onBackToResults();
    expect(selectedTrip()).toBeNull();
    expect(selectedSeat()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/travel/results']);
  });

  it('should go back from summary to passenger', () => {
    component.currentStep.set('summary');
    component.onBack();
    expect(component.currentStep()).toBe('passenger');
  });

  it('should go back from boarding to seat', () => {
    component.currentStep.set('boarding');
    component.onBack();
    expect(component.currentStep()).toBe('seat');
  });

  it('should return correct steps for bus mode', () => {
    selectedMode.set('bus');
    expect(component.steps).toEqual([
      'Seat',
      'Boarding',
      'Passengers',
      'Summary',
    ]);
  });

  it('should return correct steps for train mode', () => {
    selectedMode.set('train');
    expect(component.steps).toEqual(['Passengers', 'Summary']);
  });

  it('should return correct currentStepIndex for bus mode', () => {
    selectedMode.set('bus');
    component.currentStep.set('boarding');
    expect(component.currentStepIndex).toBe(1);
  });
});
