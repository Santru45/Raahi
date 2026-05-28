import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TravelMainComponent } from './travel-main.component';
import { TransportService } from '../travel.service';
import { ActivatedRoute } from '@angular/router';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';

describe('TravelMainComponent', () => {
  let fixture: ComponentFixture<TravelMainComponent>;
  let component: TravelMainComponent;
  let transportService: jasmine.SpyObj<TransportService>;

  const selectedModeSignal = signal<'flight' | 'train' | 'bus'>('flight');

  beforeEach(async () => {
    transportService = jasmine.createSpyObj('TransportService', [], {
      selectedMode: selectedModeSignal,
    });

    await TestBed.configureTestingModule({
      imports: [TravelMainComponent],
      providers: [
        { provide: TransportService, useValue: transportService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TravelMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should set selectedMode from query param on init', async () => {
    await TestBed.resetTestingModule();
    const modeSpy = signal<'flight' | 'train' | 'bus'>('flight');
    const ts = jasmine.createSpyObj('TransportService', [], {
      selectedMode: modeSpy,
    });

    await TestBed.configureTestingModule({
      imports: [TravelMainComponent],
      providers: [
        { provide: TransportService, useValue: ts },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => 'train' } } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    const f = TestBed.createComponent(TravelMainComponent);
    f.detectChanges();
    expect(modeSpy()).toBe('train');
  });

  it('should compute backgroundImage based on selectedMode', () => {
    selectedModeSignal.set('flight');
    expect(component.backgroundImage()).toContain('flight-bg');

    selectedModeSignal.set('train');
    expect(component.backgroundImage()).toContain('train-bg');

    selectedModeSignal.set('bus');
    expect(component.backgroundImage()).toContain('bus-bg');
  });

  it('should not set invalid mode from query param', async () => {
    await TestBed.resetTestingModule();
    const modeSpy = signal<'flight' | 'train' | 'bus'>('flight');
    const ts = jasmine.createSpyObj('TransportService', [], {
      selectedMode: modeSpy,
    });

    await TestBed.configureTestingModule({
      imports: [TravelMainComponent],
      providers: [
        { provide: TransportService, useValue: ts },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: () => 'helicopter' } },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    const f = TestBed.createComponent(TravelMainComponent);
    f.detectChanges();
    expect(modeSpy()).toBe('flight');
  });
});
