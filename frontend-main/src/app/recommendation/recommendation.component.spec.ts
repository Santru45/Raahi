import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { Component } from '@angular/core';

import { RecommendationComponent } from './recommendation.component';
import { RecommendService } from './service/recommend.service';
import { AuthService } from '../auth/auth.service';

class MockRecommendService {
  getRecommendation = jasmine.createSpy('getRecommendation').and.returnValue(
    of([
      {
        kind: 'hotel',
        hotel: {
          _id: 'h1',
          name: 'Hotel A',
          starRating: 4,
          hotelType: 'luxury',
          images: ['img1.jpg'],
          location: {
            city: 'Mumbai',
            state: 'MH',
            country: 'India',
            address: '',
            coordinates: { lat: 0, lng: 0 },
          },
          rooms: [{ basePricePerNight: 3000 }],
          amenities: [],
        },
      },
      {
        kind: 'offer',
        offer: {
          _id: 'o1',
          code: 'DEAL10',
          title: 'Deal',
          discountPercent: 10,
          images: ['img2.jpg'],
        },
      },
    ]),
  );
}

class MockAuthService {
  user = signal<any>(null);
  authError = signal<string>('');
  isLoading = signal<boolean>(false);
  forgotPasswordEmail = signal<string>('');
  forgotPasswordOtp = signal<string>('');
  getCurrentUser = jasmine.createSpy('getCurrentUser').and.returnValue(null);
  isLoggedIn = jasmine.createSpy('isLoggedIn').and.returnValue(false);
  logout = jasmine.createSpy('logout');
  login = jasmine.createSpy('login');
  signup = jasmine.createSpy('signup');
  sendForgotOtp = jasmine.createSpy('sendForgotOtp');
  getPasswordByEmail = jasmine.createSpy('getPasswordByEmail');
}

describe('RecommendationComponent', () => {
  let component: RecommendationComponent;
  let fixture: ComponentFixture<RecommendationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RecommendationComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: RecommendService, useClass: MockRecommendService },
        { provide: AuthService, useClass: MockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load hotels on init', () => {
    expect(component.hotels.length).toBe(2);
  });

  it('should set isLoading to false after loading', () => {
    expect(component.isLoading).toBeFalse();
  });

  it('should call getRecommendation on init', () => {
    const svc = TestBed.inject(
      RecommendService,
    ) as unknown as MockRecommendService;
    expect(svc.getRecommendation).toHaveBeenCalled();
  });

  it('should handle mouse enter and leave', () => {
    component.onMouseEnter();
    component.onMouseLeave();
    expect(component).toBeTruthy();
  });
});
