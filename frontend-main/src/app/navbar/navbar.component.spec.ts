import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { NavbarComponent } from './navbar.component';
import { AuthService } from '../auth/auth.service';
import { signal } from '@angular/core';

class MockAuthService {
  user = signal<any>(null);
  authError = signal<string>('');
  isLoading = signal<boolean>(false);
  getCurrentUser = jasmine.createSpy('getCurrentUser').and.returnValue(null);
  logout = jasmine.createSpy('logout');
}

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authService: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not be scrolled initially', () => {
    expect(component.isScrolled).toBeFalse();
  });

  it('should have menu closed initially', () => {
    expect(component.menuOpen).toBeFalse();
  });

  it('should have profile dropdown closed initially', () => {
    expect(component.profileOpen).toBeFalse();
  });

  it('should have wallet closed initially', () => {
    expect(component.walletOpen).toBeFalse();
  });

  // ── Menu Toggle ───────────────────────────────────────────────────────────
  it('should toggle menu', () => {
    component.toggleMenu();
    expect(component.menuOpen).toBeTrue();
    expect(component.profileOpen).toBeFalse();

    component.toggleMenu();
    expect(component.menuOpen).toBeFalse();
  });

  // ── Profile Dropdown ──────────────────────────────────────────────────────
  it('should open profile when wallet is closed', () => {
    component.walletOpen = false;
    component.openProfile();
    expect(component.profileOpen).toBeTrue();
  });

  it('should NOT open profile when wallet is open', () => {
    component.walletOpen = true;
    component.openProfile();
    expect(component.profileOpen).toBeFalse();
  });

  it('should close profile', () => {
    component.profileOpen = true;
    component.closeProfile();
    expect(component.profileOpen).toBeFalse();
  });

  // ── Wallet ────────────────────────────────────────────────────────────────
  it('should open wallet and close profile', () => {
    component.profileOpen = true;
    component.openWallet();
    expect(component.walletOpen).toBeTrue();
    expect(component.profileOpen).toBeFalse();
  });

  it('should close wallet when not mid-transaction', () => {
    component.walletOpen = true;
    component.showTopUpForm = false;
    component.topUpLoading = false;
    component.closeWallet();
    expect(component.walletOpen).toBeFalse();
  });

  it('should NOT close wallet when top-up form is showing', () => {
    component.walletOpen = true;
    component.showTopUpForm = true;
    component.closeWallet();
    expect(component.walletOpen).toBeTrue();
  });

  it('should NOT close wallet when top-up is loading', () => {
    component.walletOpen = true;
    component.topUpLoading = true;
    component.closeWallet();
    expect(component.walletOpen).toBeTrue();
  });

  // ── Close All ─────────────────────────────────────────────────────────────
  it('should close all dropdowns', () => {
    component.menuOpen = true;
    component.profileOpen = true;
    component.walletOpen = true;
    component.closeAll();
    expect(component.menuOpen).toBeFalse();
    expect(component.profileOpen).toBeFalse();
    expect(component.walletOpen).toBeFalse();
  });

  // ── Top-up Validation ─────────────────────────────────────────────────────
  it('should set error for zero amount', () => {
    component.topUpAmount = 0;
    component.openRazorpayTopUp();
    expect(component.topUpError).toBeTruthy();
  });

  it('should set error for negative amount', () => {
    component.topUpAmount = -100;
    component.openRazorpayTopUp();
    expect(component.topUpError).toContain('valid amount');
  });

  it('should set error for amount exceeding 100000', () => {
    component.topUpAmount = 200000;
    component.openRazorpayTopUp();
    expect(component.topUpError).toContain('1,00,000');
  });

  // ── Cancel Top-up ─────────────────────────────────────────────────────────
  it('should reset top-up form on cancel', () => {
    component.showTopUpForm = true;
    component.topUpAmount = 5000;
    component.topUpError = 'some error';

    component.cancelTopUp();

    expect(component.showTopUpForm).toBeFalse();
    expect(component.topUpAmount).toBeNull();
    expect(component.topUpError).toBe('');
  });

  // ── Logout confirmation ───────────────────────────────────────────────────
  it('should show confirmation modal on logout() and close menus', () => {
    component.menuOpen = true;
    component.logout();
    expect(component.showLogoutConfirm).toBeTrue();
    expect(component.menuOpen).toBeFalse();
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('should call authService.logout on doLogout() and hide modal', () => {
    component.showLogoutConfirm = true;
    component.doLogout();
    expect(authService.logout).toHaveBeenCalled();
    expect(component.showLogoutConfirm).toBeFalse();
  });

  it('should hide modal on cancelLogout()', () => {
    component.showLogoutConfirm = true;
    component.cancelLogout();
    expect(component.showLogoutConfirm).toBeFalse();
    expect(authService.logout).not.toHaveBeenCalled();
  });

  // ── Loyalty Coins ─────────────────────────────────────────────────────────
  it('should return null for loyaltyCoins when not loaded', () => {
    expect(component.loyaltyCoins).toBeNull();
  });
});
