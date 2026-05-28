import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsCardsComponent } from './stats-cards.component';

describe('StatsCardsComponent', () => {
  let component: StatsCardsComponent;
  let fixture: ComponentFixture<StatsCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsCardsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsCardsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stats', {
      totalUsers: 0,
      hotelBookings: 0,
      flightBookings: 0,
      revenue: 0,
      totalCustomers: 0,
      totalAdmins: 0,
      activeUsers: 0,
      totalBookings: 0,
      hotelRevenue: 0,
      flightRevenue: 0,
      trainRevenue: 0,
      users: [],
      cancellationRate: 0,
      avgBookingsPerCustomer: 0,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have stats input set', () => {
    expect(component.stats()).toBeTruthy();
  });

  it('should return 0 for getValue when stats are zero', () => {
    expect(component.getValue('totalUsers')).toBe(0);
    expect(component.getValue('revenue')).toBe(0);
    expect(component.getValue('totalBookings')).toBe(0);
  });

  it('should return correct value after updating stats input', () => {
    fixture.componentRef.setInput('stats', {
      totalUsers: 150,
      hotelBookings: 50,
      flightBookings: 30,
      revenue: 500000,
      totalCustomers: 120,
      totalAdmins: 5,
      activeUsers: 100,
      totalBookings: 80,
      hotelRevenue: 300000,
      flightRevenue: 150000,
      trainRevenue: 50000,
      users: [],
      cancellationRate: 10,
      avgBookingsPerCustomer: 2.5,
    });
    fixture.detectChanges();

    expect(component.getValue('totalUsers')).toBe(150);
    expect(component.getValue('revenue')).toBe(500000);
    expect(component.getValue('cancellationRate')).toBe(10);
  });

  it('should have statCards data defined', () => {
    expect(component.statCards).toBeTruthy();
    expect(component.statCards.length).toBeGreaterThan(0);
  });
});
