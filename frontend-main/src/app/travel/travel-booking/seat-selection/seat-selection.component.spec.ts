import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeatSelectionComponent } from './seat-selection.component';
import { TransportService } from '../../travel.service';
import { TravelDAO } from '../../travel.dao';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { of, throwError } from 'rxjs';

const mockTrip: any = {
  _id: 'trip1',
  type: 'bus',
  cabinClass: 'Seater',
  totalSeats: 40,
  availableSeats: 30,
};

describe('SeatSelectionComponent', () => {
  let fixture: ComponentFixture<SeatSelectionComponent>;
  let component: SeatSelectionComponent;
  let transportService: jasmine.SpyObj<TransportService>;
  let travelDao: jasmine.SpyObj<TravelDAO>;

  const selectedTrip = signal<any>(mockTrip);
  const passengerCount = signal(1);
  const selectedSeat = signal<any>(null);

  beforeEach(async () => {
    transportService = jasmine.createSpyObj('TransportService', [], {
      selectedTrip,
      passengerCount,
      selectedSeat,
    });

    travelDao = jasmine.createSpyObj('TravelDAO', ['getBookedSeats']);
    travelDao.getBookedSeats.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [SeatSelectionComponent],
      providers: [
        { provide: TransportService, useValue: transportService },
        { provide: TravelDAO, useValue: travelDao },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SeatSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should call getBookedSeats on init', () => {
    expect(travelDao.getBookedSeats).toHaveBeenCalledWith('trip1');
  });

  it('should generate seats on init', () => {
    expect(component.lowerDeck.length).toBeGreaterThan(0);
  });

  it('should set isLoading false after seats loaded', () => {
    expect(component.isLoading).toBeFalse();
  });

  it('should handle getBookedSeats error gracefully', async () => {
    await TestBed.resetTestingModule();
    const dao = jasmine.createSpyObj('TravelDAO', ['getBookedSeats']);
    dao.getBookedSeats.and.returnValue(throwError(() => new Error('fail')));
    const ts = jasmine.createSpyObj('TransportService', [], {
      selectedTrip: signal(mockTrip),
      passengerCount: signal(1),
      selectedSeat: signal(null),
    });

    await TestBed.configureTestingModule({
      imports: [SeatSelectionComponent],
      providers: [
        { provide: TransportService, useValue: ts },
        { provide: TravelDAO, useValue: dao },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    const f = TestBed.createComponent(SeatSelectionComponent);
    f.detectChanges();
    expect(f.componentInstance.isLoading).toBeFalse();
  });

  it('should select an available seat', () => {
    const seat = component.lowerDeck[0][0];
    seat.status = 'available';
    component.selectSeat(seat);
    expect(seat.status).toBe('selected');
    expect(component.selectedSeats).toContain(seat.id);
  });

  it('should deselect an already selected seat', () => {
    const seat = component.lowerDeck[0][0];
    seat.status = 'selected';
    component.selectedSeats = [seat.id];
    component.selectSeat(seat);
    expect(seat.status).toBe('available');
    expect(component.selectedSeats).not.toContain(seat.id);
  });

  it('should not select a taken seat', () => {
    const seat = component.lowerDeck[0][0];
    seat.status = 'taken';
    component.selectSeat(seat);
    expect(component.selectedSeats.length).toBe(0);
  });

  it('should not allow more seats than maxSeats', () => {
    component.maxSeats = 1;
    const seat1 = component.lowerDeck[0][0];
    const seat2 = component.lowerDeck[0][1];
    seat1.status = 'available';
    seat2.status = 'available';
    component.selectSeat(seat1);
    component.selectSeat(seat2);
    expect(component.selectedSeats.length).toBe(1);
  });

  it('should emit seatConfirmed when all seats selected', () => {
    spyOn(component.seatConfirmed, 'emit');
    component.maxSeats = 1;
    component.selectedSeats = ['1A'];
    component.onConfirmSeat();
    expect(component.seatConfirmed.emit).toHaveBeenCalledWith(['1A']);
  });

  it('should not emit seatConfirmed when seats not fully selected', () => {
    spyOn(component.seatConfirmed, 'emit');
    component.maxSeats = 2;
    component.selectedSeats = ['1A'];
    component.onConfirmSeat();
    expect(component.seatConfirmed.emit).not.toHaveBeenCalled();
  });

  it('should compute seatsRemaining correctly', () => {
    component.maxSeats = 3;
    component.selectedSeats = ['1A'];
    expect(component.seatsRemaining).toBe(2);
  });

  it('should detect flight layout', () => {
    expect(component.detectLayout('flight', 'Economy')).toBe('flight');
  });

  it('should detect bus-sleeper layout', () => {
    expect(component.detectLayout('bus', 'Sleeper')).toBe('bus-sleeper');
  });

  it('should detect bus-seater layout', () => {
    expect(component.detectLayout('bus', 'Seater')).toBe('bus-seater');
  });

  it('should return isAisleAfter true at correct column index', () => {
    expect(component.isAisleAfter(component.config.aisleAfter)).toBeTrue();
  });

  it('should set isSleeper false for bus-seater', () => {
    component.layout = 'bus-seater';
    expect(component.isSleeper).toBeFalse();
  });
});
