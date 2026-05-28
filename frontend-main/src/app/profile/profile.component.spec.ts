import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../auth/auth.service';

class MockAuthService {
  user = signal<any>({
    _id: 'u1',
    name: 'Test User',
    email: 'test@e.com',
    phone: '9876543210',
    role: 'customer',
  });
  authError = signal<string>('');
  isLoading = signal<boolean>(false);
  getCurrentUser = jasmine.createSpy('getCurrentUser').and.returnValue({
    _id: 'u1',
    name: 'Test User',
    email: 'test@e.com',
  });
  logout = jasmine.createSpy('logout');
}

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have user from auth service', () => {
    expect(component.user).toBeTruthy();
    expect(component.user?._id).toBe('u1');
  });

  it('should not show delete confirm initially', () => {
    expect(component.showDeleteConfirm).toBeFalse();
  });

  it('should be loading wallet initially', () => {
    expect(component.walletLoading).toBeTrue();
  });

  it('should not show top-up form initially', () => {
    expect(component.showTopUp).toBeFalse();
  });

  it('should not show transactions initially', () => {
    expect(component.showTransactions).toBeFalse();
  });

  it('should have null topUpAmount initially', () => {
    expect(component.topUpAmount).toBeNull();
  });

  it('should set topUpError for invalid amount', () => {
    component.wallet = { balance: 1000 };
    component.topUpAmount = 0;
    component.topUp();
    expect(component.topUpError).toBeTruthy();
  });

  it('should set topUpError for amount exceeding 100000', () => {
    component.wallet = { balance: 1000 };
    component.topUpAmount = 150000;
    component.topUp();
    expect(component.topUpError).toContain('1,00,000');
  });

  it('should not show topUpSuccess initially', () => {
    expect(component.topUpSuccess).toBe('');
  });

  // --- cancelTopUp ---
  it('cancelTopUp should reset top-up state', () => {
    component.showTopUp = true;
    component.topUpAmount = 500;
    component.topUpError = 'some error';
    component.topUpSuccess = 'some success';
    component.cancelTopUp();
    expect(component.showTopUp).toBeFalse();
    expect(component.topUpAmount).toBeNull();
    expect(component.topUpError).toBe('');
    expect(component.topUpSuccess).toBe('');
  });

  // --- topUp edge cases ---
  it('topUp should set error when topUpAmount is null', () => {
    component.wallet = { balance: 1000 };
    component.topUpAmount = null;
    component.topUp();
    expect(component.topUpError).toBeTruthy();
  });

  it('topUp should set error when wallet is null', () => {
    component.wallet = null;
    component.topUpAmount = 500;
    component.topUp();
    expect(component.topUpError).toBeTruthy();
  });

  // --- showDeleteConfirm ---
  it('should be able to set showDeleteConfirm to true', () => {
    component.showDeleteConfirm = true;
    expect(component.showDeleteConfirm).toBeTrue();
  });

  // --- showTopUp ---
  it('should be able to set showTopUp to true', () => {
    component.showTopUp = true;
    expect(component.showTopUp).toBeTrue();
  });

  // --- showTransactions ---
  it('should be able to toggle showTransactions', () => {
    component.showTransactions = true;
    expect(component.showTransactions).toBeTrue();
    component.showTransactions = false;
    expect(component.showTransactions).toBeFalse();
  });

  // --- openRazorpayCheckout validation ---
  it('openRazorpayCheckout should set error when topUpAmount is null', () => {
    component.topUpAmount = null;
    component.openRazorpayCheckout();
    expect(component.topUpError).toBeTruthy();
  });

  it('openRazorpayCheckout should set error when topUpAmount exceeds 100000', () => {
    component.topUpAmount = 200000;
    component.openRazorpayCheckout();
    expect(component.topUpError).toContain('1,00,000');
  });

  it('openRazorpayCheckout should set error when Razorpay not loaded', () => {
    component.topUpAmount = 500;
    component.topUpError = '';
    component.openRazorpayCheckout();
    // Razorpay is not defined in test env so should get an error
    expect(component.topUpError).toBeTruthy();
  });
});
