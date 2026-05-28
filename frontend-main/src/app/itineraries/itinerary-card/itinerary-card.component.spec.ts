import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ItineraryCardComponent } from './itinerary-card.component';

describe('ItineraryCardComponent', () => {
  let component: ItineraryCardComponent;
  let fixture: ComponentFixture<ItineraryCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ItineraryCardComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItineraryCardComponent);
    component = fixture.componentInstance;
    component.data = {
      title: 'Test',
      images: [],
      days: [],
      startDate: '',
      endDate: '',
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show confirm delete initially', () => {
    expect(component.confirmDelete).toBeFalse();
  });

  it('should set confirmDelete to true on first delete click', () => {
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    spyOn(event, 'preventDefault');

    component.onDelete(event);

    expect(component.confirmDelete).toBeTrue();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should emit delete event on second delete click', () => {
    spyOn(component.delete, 'emit');
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    spyOn(event, 'preventDefault');

    component.confirmDelete = true;
    component.onDelete(event);

    expect(component.delete.emit).toHaveBeenCalled();
  });

  it('should cancel delete and reset flag', () => {
    component.confirmDelete = true;
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    spyOn(event, 'preventDefault');

    component.cancelDelete(event);

    expect(component.confirmDelete).toBeFalse();
  });

  it('should have data input set', () => {
    expect(component.data).toBeTruthy();
  });
});
