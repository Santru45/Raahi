import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardingPointComponent } from './boarding-point.component';
import { TransportService } from '../../travel.service';
import { TravelDAO } from '../../travel.dao';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { of, throwError } from 'rxjs';

const mockPoints = [
  { name: 'Stop A', time: '06:00', landmark: 'Near Station' },
  { name: 'Stop B', time: '06:30', landmark: 'Near Mall' },
];

describe('BoardingPointComponent', () => {
  let fixture: ComponentFixture<BoardingPointComponent>;
  let component: BoardingPointComponent;
  let transportService: jasmine.SpyObj<TransportService>;
  let travelDao: jasmine.SpyObj<TravelDAO>;

  const selectedTrip = signal<any>({ _id: 'trip1' });
  const boardingPoint = signal('');
  const dropPoint = signal('');

  beforeEach(async () => {
    transportService = jasmine.createSpyObj('TransportService', [], {
      selectedTrip,
      boardingPoint,
      dropPoint,
    });

    travelDao = jasmine.createSpyObj('TravelDAO', ['getBoardingPoints']);
    travelDao.getBoardingPoints.and.returnValue(of(mockPoints));

    await TestBed.configureTestingModule({
      imports: [BoardingPointComponent],
      providers: [
        { provide: TransportService, useValue: transportService },
        { provide: TravelDAO, useValue: travelDao },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardingPointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load boarding and dropping points on init', () => {
    expect(travelDao.getBoardingPoints).toHaveBeenCalledWith(
      'trip1',
      'boarding',
    );
    expect(travelDao.getBoardingPoints).toHaveBeenCalledWith('trip1', 'drop');
    expect(component.boardingPoints.length).toBe(2);
    expect(component.droppingPoints.length).toBe(2);
  });

  it('should handle getBoardingPoints error gracefully', async () => {
    await TestBed.resetTestingModule();
    const dao = jasmine.createSpyObj('TravelDAO', ['getBoardingPoints']);
    dao.getBoardingPoints.and.returnValue(throwError(() => new Error('fail')));

    await TestBed.configureTestingModule({
      imports: [BoardingPointComponent],
      providers: [
        {
          provide: TransportService,
          useValue: jasmine.createSpyObj('TransportService', [], {
            selectedTrip: signal({ _id: 'trip1' }),
            boardingPoint: signal(''),
            dropPoint: signal(''),
          }),
        },
        { provide: TravelDAO, useValue: dao },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    const f = TestBed.createComponent(BoardingPointComponent);
    f.detectChanges();
    expect(f.componentInstance.boardingPoints).toEqual([]);
  });

  it('should select boarding point', () => {
    component.selectBoarding(mockPoints[0]);
    expect(component.selectedBoarding).toBe('Stop A');
    expect(boardingPoint()).toBe('Stop A');
  });

  it('should select dropping point', () => {
    component.selectDropping(mockPoints[1]);
    expect(component.selectedDropping).toBe('Stop B');
    expect(dropPoint()).toBe('Stop B');
  });

  it('should return canConfirm false until both points selected', () => {
    component.selectedBoarding = null;
    component.selectedDropping = null;
    expect(component.canConfirm).toBeFalse();
  });

  it('should return canConfirm true when both points selected', () => {
    component.selectedBoarding = 'Stop A';
    component.selectedDropping = 'Stop B';
    expect(component.canConfirm).toBeTrue();
  });

  it('should emit pointsConfirmed on onConfirm when both selected', () => {
    spyOn(component.pointsConfirmed, 'emit');
    component.selectedBoarding = 'Stop A';
    component.selectedDropping = 'Stop B';
    component.onConfirm();
    expect(component.pointsConfirmed.emit).toHaveBeenCalledWith({
      boarding: 'Stop A',
      dropping: 'Stop B',
    });
  });

  it('should not emit pointsConfirmed if not canConfirm', () => {
    spyOn(component.pointsConfirmed, 'emit');
    component.selectedBoarding = null;
    component.selectedDropping = null;
    component.onConfirm();
    expect(component.pointsConfirmed.emit).not.toHaveBeenCalled();
  });

  it('should not call getBoardingPoints if no trip', async () => {
    await TestBed.resetTestingModule();
    const dao = jasmine.createSpyObj('TravelDAO', ['getBoardingPoints']);
    dao.getBoardingPoints.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [BoardingPointComponent],
      providers: [
        {
          provide: TransportService,
          useValue: jasmine.createSpyObj('TransportService', [], {
            selectedTrip: signal(null),
            boardingPoint: signal(''),
            dropPoint: signal(''),
          }),
        },
        { provide: TravelDAO, useValue: dao },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    const f = TestBed.createComponent(BoardingPointComponent);
    f.detectChanges();
    expect(dao.getBoardingPoints).not.toHaveBeenCalled();
  });
});
