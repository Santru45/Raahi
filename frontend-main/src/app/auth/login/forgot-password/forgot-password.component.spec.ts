import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

class MockAuthService {
  authError = signal<string>('');
  isLoading = signal<boolean>(false);
  user = signal<any>(null);
  forgotPasswordEmail = signal<string>('');

  sendForgotOtp = jasmine
    .createSpy('sendForgotOtp')
    .and.returnValue(Promise.resolve(true));
  verifyForgotOtp = jasmine
    .createSpy('verifyForgotOtp')
    .and.returnValue(Promise.resolve(true));
  resetForgotPassword = jasmine
    .createSpy('resetForgotPassword')
    .and.returnValue(Promise.resolve(true));
}

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authService: MockAuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  // ── Creation ──────────────────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Initial State ─────────────────────────────────────────────────────────
  it('should start on email step', () => {
    expect(component.step).toBe('email');
  });

  it('should have empty fields initially', () => {
    expect(component.email).toBe('');
    expect(component.otp).toBe('');
    expect(component.newPassword).toBe('');
    expect(component.confirmPassword).toBe('');
  });

  it('should have passwords hidden initially', () => {
    expect(component.showNewPassword).toBeFalse();
    expect(component.showConfirmPassword).toBeFalse();
  });

  // ── Send OTP ──────────────────────────────────────────────────────────────
  it('should show email required error when sending OTP with empty email', fakeAsync(() => {
    component.email = '';
    component.sendOtp();
    tick();

    expect(component.showEmailRequired).toBeTrue();
    expect(authService.sendForgotOtp).not.toHaveBeenCalled();

    tick(3000);
    expect(component.showEmailRequired).toBeFalse();
  }));

  it('should call sendForgotOtp and move to OTP step on success', fakeAsync(() => {
    component.email = 'test@example.com';
    component.sendOtp();
    tick();

    expect(authService.sendForgotOtp).toHaveBeenCalledWith('test@example.com');
    expect(component.step).toBe('otp');

    // Clean up the resend cooldown interval
    tick(30000);
  }));

  it('should start resend cooldown after sending OTP', fakeAsync(() => {
    component.email = 'test@example.com';
    component.sendOtp();
    tick();

    expect(component.resendCooldown).toBe(30);

    tick(1000);
    expect(component.resendCooldown).toBe(29);

    // Clean up the interval
    tick(29000);
  }));

  it('should stay on email step when OTP send fails', fakeAsync(() => {
    authService.sendForgotOtp.and.returnValue(Promise.resolve(false));
    component.email = 'test@example.com';
    component.sendOtp();
    tick();

    expect(component.step).toBe('email');
  }));

  // ── Verify OTP ────────────────────────────────────────────────────────────
  it('should show OTP required error when verifying with empty OTP', fakeAsync(() => {
    component.otp = '';
    component.verifyOtp();
    tick();

    expect(component.showOtpRequired).toBeTrue();
    expect(authService.verifyForgotOtp).not.toHaveBeenCalled();

    tick(3000);
  }));

  it('should move to reset step on successful OTP verification', fakeAsync(() => {
    component.email = 'test@example.com';
    component.otp = '1234';
    component.verifyOtp();
    tick();

    expect(authService.verifyForgotOtp).toHaveBeenCalledWith(
      'test@example.com',
      '1234',
    );
    expect(component.step).toBe('reset');
  }));

  // ── Reset Password ────────────────────────────────────────────────────────
  it('should show errors when resetting with empty fields', fakeAsync(() => {
    component.step = 'reset';
    component.newPassword = '';
    component.confirmPassword = '';
    component.resetPassword();
    tick();

    expect(component.showNewPasswordRequired).toBeTrue();
    expect(component.showConfirmPasswordRequired).toBeTrue();

    tick(3000);
  }));

  it('should show mismatch error when passwords do not match', fakeAsync(() => {
    component.step = 'reset';
    component.newPassword = 'Abcdef1!';
    component.confirmPassword = 'Different1!';
    component.resetPassword();
    tick();

    expect(component.showPasswordMismatch).toBeTrue();
    expect(authService.resetForgotPassword).not.toHaveBeenCalled();

    tick(3000);
  }));

  it('should show error for password shorter than 6 chars', fakeAsync(() => {
    component.step = 'reset';
    component.email = 'test@example.com';
    component.otp = '1234';
    component.newPassword = 'Ab1!';
    component.confirmPassword = 'Ab1!';
    component.resetPassword();
    tick();

    expect(authService.authError()).toBe('password-too-short');
  }));

  it('should call resetForgotPassword with matching valid passwords', fakeAsync(() => {
    spyOn(router, 'navigate');
    component.step = 'reset';
    component.email = 'test@example.com';
    component.otp = '1234';
    component.newPassword = 'Abcdef1!';
    component.confirmPassword = 'Abcdef1!';

    component.resetPassword();
    tick();

    expect(authService.resetForgotPassword).toHaveBeenCalledWith(
      'test@example.com',
      '1234',
      'Abcdef1!',
    );

    tick(2000);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  // ── Resend OTP ────────────────────────────────────────────────────────────
  it('should not resend when cooldown is active', fakeAsync(() => {
    component.resendCooldown = 15;
    component.resendOtp();
    tick();

    expect(authService.sendForgotOtp).not.toHaveBeenCalled();
  }));

  // ── Navigation ────────────────────────────────────────────────────────────
  it('should go back to email step and clear OTP', () => {
    component.step = 'otp';
    component.otp = '1234';
    component.goBack();

    expect(component.step).toBe('email');
    expect(component.otp).toBe('');
    expect(authService.authError()).toBe('');
  });

  // ── Error Handling ────────────────────────────────────────────────────────
  it('should clear auth error when clearAuthError is called', () => {
    authService.authError.set('some-error');
    component.clearAuthError();
    expect(authService.authError()).toBe('');
  });

  it('should trigger named errors with auto-dismiss', fakeAsync(() => {
    component.triggerError('emailRequired');
    expect(component.showEmailRequired).toBeTrue();
    tick(3000);
    expect(component.showEmailRequired).toBeFalse();

    component.triggerError('otpRequired');
    expect(component.showOtpRequired).toBeTrue();
    tick(3000);
    expect(component.showOtpRequired).toBeFalse();
  }));
});
