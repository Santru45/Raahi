import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ItineraryDetailsComponent } from './itinerary-details.component';

describe('ItinenaryDetailsComponent', () => {
  let component: ItineraryDetailsComponent;
  let fixture: ComponentFixture<ItineraryDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ItineraryDetailsComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItineraryDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show add form initially', () => {
    expect(component.showAddForm).toBeFalse();
  });

  it('should not be editing trip initially', () => {
    expect(component.isEditingTrip).toBeFalse();
  });

  it('should not show delete modal initially', () => {
    expect(component.showDeleteModal).toBeFalse();
  });

  it('should have empty items list', () => {
    expect(component.items.length).toBe(0);
  });

  it('should have null currentTrip initially', () => {
    expect(component.currentTrip).toBeNull();
  });

  it('should have no pending delete', () => {
    expect(component.pendingDeleteId).toBeNull();
  });

  it('should have no selected activity initially', () => {
    expect(component.selectedActivityId).toBeNull();
  });

  it('should have today as minimum trip date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(component.tripMinDate).toBe(today);
  });
});
