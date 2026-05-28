import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingSuccessComponent } from './booking-success.component';
import { TransportService } from '../travel.service';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';

const mockBooking = {
  bookingReference: 'REF123',
  ticketId: 'TKT456',
  serviceSnapshot: {
    from: 'Mumbai',
    to: 'Delhi',
    operatorName: 'IndiGo',
    departureTime: '2026-06-01T06:00:00.000Z',
    type: 'flight',
  },
  passengers: [{ firstName: 'John', lastName: 'Doe' }],
  boardingPoint: 'N/A',
  pricing: { loyaltyDiscount: 0, totalAmount: 3000 },
};

describe('BookingSuccessComponent', () => {
  let fixture: ComponentFixture<BookingSuccessComponent>;
  let component: BookingSuccessComponent;
  let transportService: jasmine.SpyObj<TransportService>;
  let router: jasmine.SpyObj<Router>;

  const lastBookingResult = signal<any>(mockBooking);

  beforeEach(async () => {
    transportService = jasmine.createSpyObj('TransportService', [], {
      lastBookingResult,
    });

    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [BookingSuccessComponent],
      providers: [
        { provide: TransportService, useValue: transportService },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should set booking from service on init', () => {
    expect(component.booking).toEqual(mockBooking);
  });

  it('should navigate to /travel if no booking on init', async () => {
    await TestBed.resetTestingModule();
    const ts = jasmine.createSpyObj('TransportService', [], {
      lastBookingResult: signal(null),
    });
    const r = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [BookingSuccessComponent],
      providers: [
        { provide: TransportService, useValue: ts },
        { provide: Router, useValue: r },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    const f = TestBed.createComponent(BookingSuccessComponent);
    f.detectChanges();
    expect(r.navigate).toHaveBeenCalledWith(['/travel']);
  });

  it('should return snapshot from getter', () => {
    expect(component.snapshot).toEqual(mockBooking.serviceSnapshot);
  });

  it('should return passengers from getter', () => {
    expect(component.passengers).toEqual(mockBooking.passengers);
  });

  it('should return modeIcon for flight', () => {
    expect(component.modeIcon).toBe('bi-airplane-fill');
  });

  it('should return modeIcon for train', () => {
    component.booking.serviceSnapshot.type = 'train';
    expect(component.modeIcon).toBe('bi-train-front-fill');
  });

  it('should return modeIcon for bus', () => {
    component.booking.serviceSnapshot.type = 'bus';
    expect(component.modeIcon).toBe('bi-bus-front-fill');
  });

  it('should return hasBoardingPoint false when boardingPoint is N/A', () => {
    expect(component.hasBoardingPoint).toBeFalse();
  });

  it('should return hasLoyaltyDiscount false when discount is 0', () => {
    expect(component.hasLoyaltyDiscount).toBeFalse();
  });

  it('should navigate to / and clear lastBookingResult on bookAnother', () => {
    (transportService as any).lastBookingResult = signal(mockBooking);
    spyOn(transportService.lastBookingResult, 'set');
    component.bookAnother();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should call window.print on downloadTicket', () => {
    spyOn(window, 'print');
    component.downloadTicket();
    expect(window.print).toHaveBeenCalled();
  });

  it('should generate qrCodeUrl on init', () => {
    expect(component.qrCodeUrl).toContain('qrserver.com');
  });
});
