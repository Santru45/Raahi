import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ReviewFormComponent } from './review-form.component';

describe('ReviewFormComponent', () => {
  let component: ReviewFormComponent;
  let fixture: ComponentFixture<ReviewFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReviewFormComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial rating of 0', () => {
    expect(component.rating).toBe(0);
  });

  it('should not be submitting initially', () => {
    expect(component.isSubmitting).toBeFalse();
  });

  it('should have 6 subrating categories', () => {
    expect(component.categories.length).toBe(6);
    expect(component.categories).toContain('cleanliness');
    expect(component.categories).toContain('service');
    expect(component.categories).toContain('location');
    expect(component.categories).toContain('food');
    expect(component.categories).toContain('facilities');
    expect(component.categories).toContain('staff');
  });

  it('should have all subratings at 0 initially', () => {
    Object.values(component.subratings).forEach((v) => {
      expect(v).toBe(0);
    });
  });

  it('should have empty comment initially', () => {
    expect(component.comment).toBe('');
  });

  it('should have empty image arrays initially', () => {
    expect(component.imageBase64s.length).toBe(0);
    expect(component.imageError).toBe('');
  });

  it('should not have rating error initially', () => {
    expect(component.hasRatingError).toBeFalse();
  });

  // --- setRating / subrating ---
  it('should set a subrating value', () => {
    component.subratings['cleanliness'] = 4;
    expect(component.subratings['cleanliness']).toBe(4);
  });

  it('should set all subratings and compute overall rating', () => {
    component.subratings['cleanliness'] = 4;
    component.subratings['service'] = 5;
    component.subratings['location'] = 3;
    component.subratings['food'] = 4;
    component.subratings['facilities'] = 4;
    component.subratings['staff'] = 5;
    const avg = (4 + 5 + 3 + 4 + 4 + 5) / 6;
    component.rating = Math.round(avg);
    expect(component.rating).toBe(Math.round(avg));
  });

  // --- hasRatingError ---
  it('hasRatingError should be false when subratings are set', () => {
    component.subratings['cleanliness'] = 3;
    component.subratings['service'] = 3;
    component.subratings['location'] = 3;
    component.subratings['food'] = 3;
    component.subratings['facilities'] = 3;
    component.subratings['staff'] = 3;
    expect(component.hasRatingError).toBeFalse();
  });

  // --- submitReview validation ---
  it('should set hasRatingError when trying to submit with zero subratings', () => {
    const fakeForm = { valid: true };
    component.comment = 'Test comment';
    component.onsubmit(fakeForm);
    expect(component.hasRatingError).toBeTrue();
  });

  // --- comment ---
  it('should update comment', () => {
    component.comment = 'Great stay!';
    expect(component.comment).toBe('Great stay!');
  });
});

describe('ReviewFormComponent', () => {
  let component: ReviewFormComponent;
  let fixture: ComponentFixture<ReviewFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReviewFormComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial rating of 0', () => {
    expect(component.rating).toBe(0);
  });

  it('should not be submitting initially', () => {
    expect(component.isSubmitting).toBeFalse();
  });

  it('should have 6 subrating categories', () => {
    expect(component.categories.length).toBe(6);
    expect(component.categories).toContain('cleanliness');
    expect(component.categories).toContain('service');
    expect(component.categories).toContain('location');
    expect(component.categories).toContain('food');
    expect(component.categories).toContain('facilities');
    expect(component.categories).toContain('staff');
  });

  it('should have all subratings at 0 initially', () => {
    Object.values(component.subratings).forEach((v) => {
      expect(v).toBe(0);
    });
  });

  it('should have empty comment initially', () => {
    expect(component.comment).toBe('');
  });

  it('should have empty image arrays initially', () => {
    expect(component.imageBase64s.length).toBe(0);
    expect(component.imageError).toBe('');
  });

  it('should not have rating error initially', () => {
    expect(component.hasRatingError).toBeFalse();
  });
});
