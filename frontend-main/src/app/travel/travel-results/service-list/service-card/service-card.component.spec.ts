import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceCardComponent } from './service-card.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

const mockTrip: any = {
  _id: '1',
  type: 'flight',
  fare: 3000,
  marketRate: 4000,
  totalSeats: 100,
  bookedSeats: [],
  operatorName: 'IndiGo',
  from: 'Mumbai',
  to: 'Delhi',
  schedule: {
    departureTime: '2026-06-01T06:00:00.000Z',
    arrivalTime: '2026-06-01T09:00:00.000Z',
    duration: '3h',
  },
  cabinClass: 'Economy',
  taxPercent: 5,
  availableSeats: 100,
};

describe('ServiceCardComponent', () => {
  let fixture: ComponentFixture<ServiceCardComponent>;
  let component: ServiceCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('trip', mockTrip);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should calculate savings correctly', () => {
    expect(component.savings).toBe(1000);
  });

  it('should calculate availableSeatsCount from totalSeats minus bookedSeats', () => {
    expect(component.availableSeatsCount).toBe(100);
  });

  it('should return isLowAvailability false when seats > 10', () => {
    expect(component.isLowAvailability).toBeFalse();
  });

  it('should return isLowAvailability true when seats < 10', () => {
    fixture.componentRef.setInput('trip', {
      ...mockTrip,
      totalSeats: 5,
      bookedSeats: [],
    });
    expect(component.isLowAvailability).toBeTrue();
  });

  it('should return "berths" for train type', () => {
    fixture.componentRef.setInput('trip', { ...mockTrip, type: 'train' });
    expect(component.seatLabel).toBe('berths');
  });

  it('should return "seats" for flight type', () => {
    expect(component.seatLabel).toBe('seats');
  });

  it('should emit tripSelected on onSelect', () => {
    spyOn(component.tripSelected, 'emit');
    component.onSelect();
    expect(component.tripSelected.emit).toHaveBeenCalledWith(mockTrip);
  });

  it('should format time from ISO string', () => {
    const result = component.formatTime('2026-06-01T06:00:00.000Z');
    expect(result).toBeTruthy();
  });
});
