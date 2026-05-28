import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ReviewPageComponent } from './review-page.component';

describe('ReviewPageComponent', () => {
  let component: ReviewPageComponent;
  let fixture: ComponentFixture<ReviewPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReviewPageComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty reviews initially', () => {
    expect(component.reviews.length).toBe(0);
  });

  it('should have avgRating of 0 initially', () => {
    expect(component.avgRating).toBe(0);
  });

  it('should have totalReviews of 0 initially', () => {
    expect(component.totalReviews).toBe(0);
  });

  it('should be loading initially', () => {
    expect(component.isLoading).toBeTrue();
  });

  it('should have empty entityId by default', () => {
    expect(component.entityId).toBe('');
  });
});
