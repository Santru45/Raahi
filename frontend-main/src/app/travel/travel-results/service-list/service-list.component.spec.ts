import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceListComponent } from './service-list.component';
import { TransportService } from '../../travel.service';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';

describe('ServiceListComponent', () => {
  let fixture: ComponentFixture<ServiceListComponent>;
  let component: ServiceListComponent;

  beforeEach(async () => {
    const transportService = jasmine.createSpyObj('TransportService', [], {
      selectedMode: signal('flight'),
    });

    await TestBed.configureTestingModule({
      imports: [ServiceListComponent],
      providers: [{ provide: TransportService, useValue: transportService }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should emit tripSelected when onTripSelected is called', () => {
    spyOn(component.tripSelected, 'emit');
    const trip = { _id: 'abc' } as any;
    component.onTripSelected(trip);
    expect(component.tripSelected.emit).toHaveBeenCalledWith(trip);
  });

  it('should default trips input to empty array', () => {
    expect(component.trips()).toEqual([]);
  });
});
