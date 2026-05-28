import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { SignupComponent } from './signup.component';
import { AuthService } from '../auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

class MockAuthService {
  authError = signal<string>('');
  isLoading = signal<boolean>(false);
  user = signal<any>(null);
  signup = jasmine.createSpy('signup');
}

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;
  let authService: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignupComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    fixture.detectChanges();
  });

  // ── Component Creation ────────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Initial State ─────────────────────────────────────────────────────────
  it('should clear auth error on init', () => {
    expect(authService.authError()).toBe('');
  });

  it('should have empty form on init', () => {
    expect(component.form.get('name')?.value).toBe('');
    expect(component.form.get('email')?.value).toBe('');
    expect(component.form.get('phone')?.value).toBe('');
    expect(component.form.get('password')?.value).toBe('');
    expect(component.form.get('confirmPassword')?.value).toBe('');
  });

  it('should have passwords hidden by default', () => {
    expect(component.showPassword).toBeFalse();
    expect(component.showConfirmPassword).toBeFalse();
  });

  // ── Form Validations ─────────────────────────────────────────────────────
  it('should mark form invalid when all fields empty', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('should validate name min length (2 chars)', () => {
    component.form.get('name')?.setValue('A');
    expect(component.form.get('name')?.hasError('nameTooShort')).toBeTrue();
  });

  it('should validate name max length (50 chars)', () => {
    component.form.get('name')?.setValue('A'.repeat(51));
    expect(component.form.get('name')?.hasError('nameTooLong')).toBeTrue();
  });

  it('should reject names with numbers', () => {
    component.form.get('name')?.setValue('John123');
    expect(component.form.get('name')?.hasError('nameInvalid')).toBeTrue();
  });

  it('should accept valid names with spaces', () => {
    component.form.get('name')?.setValue('John Doe');
    expect(component.form.get('name')?.valid).toBeTrue();
  });

  it('should reject invalid emails', () => {
    component.form.get('email')?.setValue('notanemail');
    expect(component.form.get('email')?.hasError('invalidEmail')).toBeTrue();
  });

  it('should accept valid emails', () => {
    component.form.get('email')?.setValue('user@example.com');
    expect(component.form.get('email')?.valid).toBeTrue();
  });

  it('should reject invalid phone numbers', () => {
    component.form.get('phone')?.setValue('1234567890');
    expect(component.form.get('phone')?.hasError('invalidPhone')).toBeTrue();
  });

  it('should accept valid Indian phone numbers', () => {
    component.form.get('phone')?.setValue('9876543210');
    expect(component.form.get('phone')?.valid).toBeTrue();
  });

  it('should enforce password minimum length', () => {
    component.form.get('password')?.setValue('Ab1!');
    expect(component.form.get('password')?.hasError('minlength')).toBeTrue();
  });

  it('should require uppercase in password', () => {
    component.form.get('password')?.setValue('abcdef1!');
    expect(component.form.get('password')?.hasError('noUpper')).toBeTrue();
  });

  it('should require lowercase in password', () => {
    component.form.get('password')?.setValue('ABCDEF1!');
    expect(component.form.get('password')?.hasError('noLower')).toBeTrue();
  });

  it('should require number in password', () => {
    component.form.get('password')?.setValue('Abcdef!@');
    expect(component.form.get('password')?.hasError('noNumber')).toBeTrue();
  });

  it('should require special character in password', () => {
    component.form.get('password')?.setValue('Abcdef12');
    expect(component.form.get('password')?.hasError('noSpecial')).toBeTrue();
  });

  it('should accept a strong password', () => {
    component.form.get('password')?.setValue('Abcdef1!');
    expect(component.form.get('password')?.valid).toBeTrue();
  });

  it('should detect password mismatch', () => {
    component.form.get('password')?.setValue('Abcdef1!');
    component.form.get('confirmPassword')?.setValue('DifferentPass1!');
    component.form.get('confirmPassword')?.markAsTouched();
    expect(component.form.hasError('passwordMismatch')).toBeTrue();
  });

  it('should pass when passwords match', () => {
    component.form.get('password')?.setValue('Abcdef1!');
    component.form.get('confirmPassword')?.setValue('Abcdef1!');
    expect(component.form.hasError('passwordMismatch')).toBeFalse();
  });

  // ── Password Strength Getters ─────────────────────────────────────────────
  it('should report password rules correctly', () => {
    component.form.get('password')?.setValue('Abcdef1!');
    expect(component.ruleMinLength).toBeTrue();
    expect(component.ruleUpper).toBeTrue();
    expect(component.ruleLower).toBeTrue();
    expect(component.ruleNumber).toBeTrue();
    expect(component.ruleSpecial).toBeTrue();
    expect(component.allRulesMet).toBeTrue();
  });

  it('should report allRulesMet as false when password is weak', () => {
    component.form.get('password')?.setValue('abc');
    expect(component.allRulesMet).toBeFalse();
  });

  // ── onlyLetters filter ────────────────────────────────────────────────────
  it('should strip numbers from name input via onlyLetters', () => {
    const input = document.createElement('input');
    input.value = 'John123';
    const event = { target: input } as unknown as Event;
    component.onlyLetters(event);
    expect(input.value).toBe('John');
  });

  // ── onlyNumbers filter ────────────────────────────────────────────────────
  it('should strip letters from phone input via onlyNumbers', () => {
    const input = document.createElement('input');
    input.value = '987abc654';
    const event = { target: input } as unknown as Event;
    component.onlyNumbers(event);
    expect(input.value).toBe('987654');
  });

  // ── Required Error Triggers ───────────────────────────────────────────────
  it('should show required errors for empty fields on submit', fakeAsync(() => {
    component.onSubmit();
    expect(component.showNameRequired).toBeTrue();
    expect(component.showEmailRequired).toBeTrue();
    expect(component.showPhoneRequired).toBeTrue();
    expect(component.showPasswordRequired).toBeTrue();
    expect(component.showConfirmPasswordRequired).toBeTrue();
    expect(authService.signup).not.toHaveBeenCalled();

    tick(3000);
    expect(component.showNameRequired).toBeFalse();
  }));

  // ── Title Case ────────────────────────────────────────────────────────────
  it('should convert name to title case on submit', () => {
    component.form.get('name')?.setValue('john doe');
    component.form.get('email')?.setValue('john@example.com');
    component.form.get('phone')?.setValue('9876543210');
    component.form.get('password')?.setValue('Abcdef1!');
    component.form.get('confirmPassword')?.setValue('Abcdef1!');

    component.onSubmit();

    expect(authService.signup).toHaveBeenCalled();
    const submittedUser = authService.signup.calls.mostRecent().args[0];
    expect(submittedUser.name).toBe('John Doe');
  });

  // ── Successful Submit ─────────────────────────────────────────────────────
  it('should call authService.signup with correct user data', () => {
    component.form.get('name')?.setValue('Jane Smith');
    component.form.get('email')?.setValue('jane@test.com');
    component.form.get('phone')?.setValue('9876543210');
    component.form.get('password')?.setValue('Abcdef1!');
    component.form.get('confirmPassword')?.setValue('Abcdef1!');

    component.onSubmit();

    expect(authService.signup).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: 'Jane Smith',
        email: 'jane@test.com',
        phone: '9876543210',
        passwordHash: 'Abcdef1!',
        role: 'customer',
        isActive: true,
      }),
    );
  });

  it('should not call signup when form is invalid', () => {
    component.form.get('name')?.setValue('Jane');
    component.form.get('email')?.setValue('bademail');
    component.form.get('phone')?.setValue('9876543210');
    component.form.get('password')?.setValue('Abcdef1!');
    component.form.get('confirmPassword')?.setValue('Abcdef1!');
    component.form.markAllAsTouched();

    component.onSubmit();
    expect(authService.signup).not.toHaveBeenCalled();
  });

  // ── Auth Error Display ────────────────────────────────────────────────────
  it('should display auth error from service', () => {
    authService.authError.set('Internal server error. Please try again later.');
    fixture.detectChanges();

    const errorEl = fixture.debugElement.query(By.css('.field-error'));
    expect(errorEl).toBeTruthy();
  });

  // ── Loading State ─────────────────────────────────────────────────────────
  it('should disable submit button when loading', () => {
    authService.isLoading.set(true);
    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('button[type="submit"]'));
    expect(btn.nativeElement.disabled).toBeTrue();
  });
});
