import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { ItineraryComponent } from './itinerary.component';
import { ItineraryService } from '../itinerary.service';
import { AuthService } from '../../auth/auth.service';

describe('ItineraryComponent', () => {
  let component: ItineraryComponent;
  let fixture: ComponentFixture<ItineraryComponent>;

  const mockItineraryService = {
    getItineraries: jasmine.createSpy('getItineraries').and.returnValue(of([])),
    createItinerary: jasmine
      .createSpy('createItinerary')
      .and.returnValue(
        of({
          _id: 'new1',
          trip_name: 'New Trip',
          type: 'custom',
          user_id: 'u1',
        }),
      ),
    deleteItinerary: jasmine
      .createSpy('deleteItinerary')
      .and.returnValue(of({})),
  };

  const mockAuthService = {
    getCurrentUser: jasmine
      .createSpy('getCurrentUser')
      .and.returnValue({ _id: 'u1' }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ItineraryComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: ItineraryService, useValue: mockItineraryService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItineraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to std tab', () => {
    expect(component.activeTab).toBe('std');
  });

  it('should have empty standard and custom lists initially', () => {
    expect(component.standardList.length).toBe(0);
    expect(component.customList.length).toBe(0);
  });

  it('should not show create form initially', () => {
    expect(component.showCreateForm).toBeFalse();
  });

  it('should toggle create form visibility', () => {
    component.toggleCreateForm();
    expect(component.showCreateForm).toBeTrue();
    component.toggleCreateForm();
    expect(component.showCreateForm).toBeFalse();
  });

  it('should switch tab and save to sessionStorage', () => {
    component.setTab('custom');
    expect(component.activeTab).toBe('custom');
    expect(sessionStorage.getItem('itinerary_active_tab')).toBe('custom');

    component.setTab('std');
    expect(component.activeTab).toBe('std');
  });

  it('should hide create form when switching tabs', () => {
    component.showCreateForm = true;
    component.setTab('std');
    expect(component.showCreateForm).toBeFalse();
  });

  it('should initialize create form with required trip_name', () => {
    expect(component.createForm).toBeTruthy();
    expect(component.createForm.get('trip_name')?.value).toBe('');
    component.createForm.get('trip_name')?.setValue('');
    expect(component.createForm.get('trip_name')?.valid).toBeFalse();
  });

  it('should require trip_name min length of 3', () => {
    component.createForm.get('trip_name')?.setValue('Ab');
    expect(component.createForm.get('trip_name')?.valid).toBeFalse();
    component.createForm.get('trip_name')?.setValue('Abc');
    expect(component.createForm.get('trip_name')?.valid).toBeTrue();
  });

  // --- isLoggedIn ---
  it('isLoggedIn should return true when user is logged in', () => {
    expect(component.isLoggedIn).toBeTrue();
  });

  // --- onCreateSubmit ---
  it('onCreateSubmit should not call service when form is invalid', () => {
    mockItineraryService.createItinerary.calls.reset();
    component.createForm.get('trip_name')?.setValue('');
    component.onCreateSubmit();
    expect(mockItineraryService.createItinerary).not.toHaveBeenCalled();
  });

  it('onCreateSubmit should call service when form is valid', () => {
    mockItineraryService.createItinerary.calls.reset();
    mockItineraryService.getItineraries.and.returnValue(of([]));
    component.createForm.get('trip_name')?.setValue('My Trip');
    component.onCreateSubmit();
    expect(mockItineraryService.createItinerary).toHaveBeenCalled();
  });

  it('onCreateSubmit should reset form and hide form on success', () => {
    mockItineraryService.createItinerary.and.returnValue(
      of({ _id: 'new1', trip_name: 'My Trip', type: 'custom', user_id: 'u1' }),
    );
    mockItineraryService.getItineraries.and.returnValue(of([]));
    component.showCreateForm = true;
    component.createForm.get('trip_name')?.setValue('My Trip');
    component.onCreateSubmit();
    expect(component.showCreateForm).toBeFalse();
    expect(component.createForm.get('trip_name')?.value).toBeNull();
  });

  // --- onDeleteItinerary ---
  it('onDeleteItinerary should remove item from customList', () => {
    component.customList = [
      {
        _id: 'id1',
        trip_name: 'Trip 1',
        type: 'custom',
        user_id: 'u1',
        images: [],
      } as any,
      {
        _id: 'id2',
        trip_name: 'Trip 2',
        type: 'custom',
        user_id: 'u1',
        images: [],
      } as any,
    ];
    component.onDeleteItinerary('id1');
    expect(component.customList.length).toBe(1);
    expect(component.customList[0]._id).toBe('id2');
  });

  // --- loadItineraries filters std and custom ---
  it('loadItineraries should separate std and custom itineraries', () => {
    const items = [
      {
        _id: 's1',
        trip_name: 'Std Trip',
        type: 'std',
        user_id: null,
        images: [],
      },
      {
        _id: 'c1',
        trip_name: 'Custom Trip',
        type: 'custom',
        user_id: 'u1',
        images: [],
      },
      {
        _id: 'c2',
        trip_name: 'Other User',
        type: 'custom',
        user_id: 'u2',
        images: [],
      },
    ];
    mockItineraryService.getItineraries.and.returnValue(of(items));
    component.loadItineraries();
    expect(component.standardList.length).toBe(1);
    expect(component.customList.length).toBe(1);
    expect(component.customList[0]._id).toBe('c1');
  });
});

describe('ItineraryComponent', () => {
  let component: ItineraryComponent;
  let fixture: ComponentFixture<ItineraryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ItineraryComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItineraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to std tab', () => {
    expect(component.activeTab).toBe('std');
  });

  it('should have empty standard and custom lists initially', () => {
    expect(component.standardList.length).toBe(0);
    expect(component.customList.length).toBe(0);
  });

  it('should not show create form initially', () => {
    expect(component.showCreateForm).toBeFalse();
  });

  it('should toggle create form visibility', () => {
    component.toggleCreateForm();
    expect(component.showCreateForm).toBeTrue();
    component.toggleCreateForm();
    expect(component.showCreateForm).toBeFalse();
  });

  it('should switch tab and save to sessionStorage', () => {
    component.setTab('custom');
    expect(component.activeTab).toBe('custom');
    expect(sessionStorage.getItem('itinerary_active_tab')).toBe('custom');

    component.setTab('std');
    expect(component.activeTab).toBe('std');
  });

  it('should hide create form when switching tabs', () => {
    component.showCreateForm = true;
    component.setTab('std');
    expect(component.showCreateForm).toBeFalse();
  });

  it('should initialize create form with required trip_name', () => {
    expect(component.createForm).toBeTruthy();
    expect(component.createForm.get('trip_name')?.value).toBe('');
    component.createForm.get('trip_name')?.setValue('');
    expect(component.createForm.get('trip_name')?.valid).toBeFalse();
  });

  it('should require trip_name min length of 3', () => {
    component.createForm.get('trip_name')?.setValue('Ab');
    expect(component.createForm.get('trip_name')?.valid).toBeFalse();
    component.createForm.get('trip_name')?.setValue('Abc');
    expect(component.createForm.get('trip_name')?.valid).toBeTrue();
  });
});
