import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 4 destinations', () => {
    expect(component.destinations.length).toBe(4);
  });

  it('should include Delhi, Goa, Mumbai, Jaipur', () => {
    const cities = component.destinations.map((d) => d.city);
    expect(cities).toContain('New Delhi');
    expect(cities).toContain('Goa');
    expect(cities).toContain('Mumbai');
    expect(cities).toContain('Jaipur');
  });

  it('should have country India for all destinations', () => {
    component.destinations.forEach((d) => {
      expect(d.country).toBe('India');
    });
  });

  it('should navigate to hotel search with city query param', () => {
    spyOn(router, 'navigate');
    component.goToDestination('Goa');
    expect(router.navigate).toHaveBeenCalledWith(['/hotel'], {
      queryParams: { destination: 'Goa' },
    });
  });

  it('should have image URLs for all destinations', () => {
    component.destinations.forEach((d) => {
      expect(d.image).toBeTruthy();
      expect(d.image).toContain('unsplash.com');
    });
  });

  it('should have count > 0 for all destinations', () => {
    component.destinations.forEach((d) => {
      expect(d.count).toBeGreaterThan(0);
    });
  });
});
