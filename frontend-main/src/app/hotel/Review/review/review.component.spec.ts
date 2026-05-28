import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ReviewComponent } from './review.component';

describe('ReviewComponent', () => {
  let component: ReviewComponent;
  let fixture: ComponentFixture<ReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewComponent);
    component = fixture.componentInstance;
    component.review = {
      name: 'Test User',
      userId: '1',
      entityId: '1',
      entityType: 'hotel',
      rating: 4,
      comment: 'Great',
      year: 2024,
      isVerified: true,
      createdAt: '2024-01-01',
      subrating: {
        cleanliness: 4,
        service: 4,
        location: 4,
        food: 4,
        facilities: 4,
        staff: 4,
      },
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have stars array [1,2,3,4,5]', () => {
    expect(component.stars).toEqual([1, 2, 3, 4, 5]);
  });

  it('should compute floor correctly', () => {
    expect(component.floor(4.7)).toBe(4);
    expect(component.floor(3.0)).toBe(3);
  });

  it('should compute ceil correctly', () => {
    expect(component.ceil(4.2)).toBe(5);
    expect(component.ceil(3.0)).toBe(3);
  });

  it('should detect half star correctly', () => {
    expect(component.hasHalfStar(4.5, 5)).toBeTrue();
    expect(component.hasHalfStar(4.5, 4)).toBeFalse();
    expect(component.hasHalfStar(4.0, 4)).toBeFalse();
  });

  it('should have review input set', () => {
    expect(component.review.name).toBe('Test User');
    expect(component.review.rating).toBe(4);
  });
});
