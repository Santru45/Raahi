import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { LoyaltyComponent } from './loyalty.component';

describe('LoyaltyComponent', () => {
  let component: LoyaltyComponent;
  let fixture: ComponentFixture<LoyaltyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoyaltyComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(LoyaltyComponent);
    component = fixture.componentInstance;
    component.userId = 'test-user-1';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have userId input set', () => {
    expect(component.userId).toBe('test-user-1');
  });

  it('should have 4 milestones', () => {
    expect(component.milestones.length).toBe(4);
  });

  it('should have milestones in order: Bronze, Silver, Gold, Platinum', () => {
    expect(component.milestones[0].label).toBe('Bronze');
    expect(component.milestones[1].label).toBe('Silver');
    expect(component.milestones[2].label).toBe('Gold');
    expect(component.milestones[3].label).toBe('Platinum');
  });

  it('should have increasing minCoins for milestones', () => {
    for (let i = 1; i < component.milestones.length; i++) {
      expect(component.milestones[i].minCoins).toBeGreaterThan(
        component.milestones[i - 1].minCoins,
      );
    }
  });

  it('should calculate progress correctly when account exists', () => {
    component.account = {
      totalEarned: 300,
      coinBalance: 200,
    } as any;

    component.calculateProgress();

    expect(component.progressPercent).toBeGreaterThan(0);
    expect(component.nextMilestone).toBeTruthy();
    expect(component.nextMilestone.label).toBe('Gold');
    expect(component.remainingToNext).toBe(300); // 600 - 300
  });

  it('should set 100% progress when earned exceeds max milestone', () => {
    component.account = {
      totalEarned: 2000,
      coinBalance: 1800,
    } as any;

    component.calculateProgress();

    expect(component.progressPercent).toBe(100);
    expect(component.nextMilestone).toBeNull();
    expect(component.remainingToNext).toBe(0);
  });

  it('should check isReached correctly', () => {
    component.account = { totalEarned: 700 } as any;

    expect(component.isReached(0)).toBeTrue();
    expect(component.isReached(200)).toBeTrue();
    expect(component.isReached(600)).toBeTrue();
    expect(component.isReached(1500)).toBeFalse();
  });
});
