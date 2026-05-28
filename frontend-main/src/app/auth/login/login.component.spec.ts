import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';

// ── Mock AuthService ──────────────────────────────────────────────────────────
class MockAuthService {
  authError = signal<string>('');
  isLoading = signal<boolean>(false);
  user = signal<any>(null);

  login = jasmine.createSpy('login');
  getCurrentUser = jasmine.createSpy('getCurrentUser').and.returnValue(null);
  logout = jasmine.createSpy('logout');
  getPasswordByEmail = jasmine.createSpy('getPasswordByEmail');
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    fixture.detectChanges();
  });

  // ── Component Creation ────────────────────────────────────────────────────
  it('should create the login component', () => {
    expect(component).toBeTruthy();
  });

  // ── Initial State ─────────────────────────────────────────────────────────
  it('should have empty form fields on init', () => {
    expect(component.formData.email).toBe('');
    expect(component.formData.password).toBe('');
  });

  it('should have password hidden by default', () => {
    expect(component.showPassword).toBeFalse();
    const passwordInput = fixture.debugElement.query(
      By.css('input[name="password"]'),
    );
    expect(passwordInput.nativeElement.type).toBe('password');
  });

  it('should have rememberMe unchecked by default', () => {
    expect(component.rememberMe).toBeFalse();
  });

  // ── UI Rendering ──────────────────────────────────────────────────────────
  it('should display "Welcome Back" heading', () => {
    const heading = fixture.debugElement.query(By.css('h2'));
    expect(heading.nativeElement.textContent).toContain('Welcome Back');
  });

  it('should display "Sign In" on submit button', () => {
    const btn = fixture.debugElement.query(By.css('button[type="submit"]'));
    expect(btn.nativeElement.textContent.trim()).toContain('Sign In');
  });

  it('should have a link to signup page', () => {
    const signupLink = fixture.debugElement.query(
      By.css('a[routerLink="/signup"]'),
    );
    expect(signupLink).toBeTruthy();
    expect(signupLink.nativeElement.textContent.trim()).toBe('Sign up');
  });

  it('should have a link to forgot-password page', () => {
    const link = fixture.debugElement.query(
      By.css('a[routerLink="/forgot-password"]'),
    );
    expect(link).toBeTruthy();
  });

  // ── Password Toggle ──────────────────────────────────────────────────────
  it('should toggle password visibility when eye icon is clicked', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePassword();
    fixture.detectChanges();

    expect(component.showPassword).toBeTrue();
    const passwordInput = fixture.debugElement.query(
      By.css('input[name="password"]'),
    );
    expect(passwordInput.nativeElement.type).toBe('text');

    component.togglePassword();
    fixture.detectChanges();
    expect(passwordInput.nativeElement.type).toBe('password');
  });

  // ── Empty Field Validation ────────────────────────────────────────────────
  it('should show email required error when submitting with empty email', fakeAsync(() => {
    component.formData.email = '';
    component.formData.password = 'somePassword';
    component.handleFormSubmit();
    fixture.detectChanges();

    expect(component.showEmailRequired).toBeTrue();
    expect(authService.login).not.toHaveBeenCalled();

    tick(3000);
    expect(component.showEmailRequired).toBeFalse();
  }));

  it('should show password required error when submitting with empty password', fakeAsync(() => {
    component.formData.email = 'test@example.com';
    component.formData.password = '';
    component.handleFormSubmit();
    fixture.detectChanges();

    expect(component.showPasswordRequired).toBeTrue();
    expect(authService.login).not.toHaveBeenCalled();

    tick(3000);
    expect(component.showPasswordRequired).toBeFalse();
  }));

  it('should show both required errors when submitting with all fields empty', fakeAsync(() => {
    component.formData.email = '';
    component.formData.password = '';
    component.handleFormSubmit();
    fixture.detectChanges();

    expect(component.showEmailRequired).toBeTrue();
    expect(component.showPasswordRequired).toBeTrue();
    expect(authService.login).not.toHaveBeenCalled();

    tick(3000);
  }));

  // ── Successful Submission ─────────────────────────────────────────────────
  it('should call authService.login with correct params on valid submit', () => {
    component.formData.email = 'user@example.com';
    component.formData.password = 'Secret1!';
    component.rememberMe = true;

    // The NgForm needs to be valid — set values via the form
    fixture.detectChanges();
    component.handleFormSubmit();

    expect(authService.login).toHaveBeenCalledWith(
      'user@example.com',
      'Secret1!',
      true,
    );
  });

  // ── Auth Error Display ────────────────────────────────────────────────────
  it('should display "email not registered" error from authService', () => {
    authService.authError.set('email-not-found');
    fixture.detectChanges();

    const errorEl = fixture.debugElement.query(By.css('.field-error'));
    expect(errorEl).toBeTruthy();
    expect(errorEl.nativeElement.textContent).toContain('not registered');
  });

  it('should display "incorrect password" error from authService', () => {
    authService.authError.set('wrong-password');
    fixture.detectChanges();

    const errors = fixture.debugElement.queryAll(By.css('.field-error'));
    const wrongPwError = errors.find((e) =>
      e.nativeElement.textContent.includes('Incorrect password'),
    );
    expect(wrongPwError).toBeTruthy();
  });

  it('should display server error message', () => {
    authService.authError.set('server-error');
    fixture.detectChanges();

    const errors = fixture.debugElement.queryAll(By.css('.field-error'));
    const serverError = errors.find((e) =>
      e.nativeElement.textContent.includes('Unable to connect'),
    );
    expect(serverError).toBeTruthy();
  });

  // ── Clear Errors ──────────────────────────────────────────────────────────
  it('should clear auth error when clearError is called', () => {
    authService.authError.set('email-not-found');
    component.clearError();
    expect(authService.authError()).toBe('');
  });

  it('should clear email required flag on clearEmailRequired', () => {
    component.showEmailRequired = true;
    component.clearEmailRequired();
    expect(component.showEmailRequired).toBeFalse();
  });

  it('should clear password required flag on clearPasswordRequired', () => {
    component.showPasswordRequired = true;
    component.clearPasswordRequired();
    expect(component.showPasswordRequired).toBeFalse();
  });

  // ── Loading State ─────────────────────────────────────────────────────────
  it('should disable submit button when loading', () => {
    authService.isLoading.set(true);
    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('button[type="submit"]'));
    expect(btn.nativeElement.disabled).toBeTrue();
  });

  it('should show spinner when loading', () => {
    authService.isLoading.set(true);
    fixture.detectChanges();

    const spinners = fixture.debugElement.queryAll(By.css('.spinner-grow'));
    expect(spinners.length).toBe(3);
  });

  // ── Remember Me ───────────────────────────────────────────────────────────
  it('should pass rememberMe=false by default to login', () => {
    component.formData.email = 'user@example.com';
    component.formData.password = 'Secret1!';
    fixture.detectChanges();
    component.handleFormSubmit();

    expect(authService.login).toHaveBeenCalledWith(
      'user@example.com',
      'Secret1!',
      false,
    );
  });

  // ── Redirect if already logged in ─────────────────────────────────────────
  it('should redirect if user is already logged in on init', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    authService.getCurrentUser.and.returnValue({ _id: '123', name: 'Test' });

    component.ngOnInit();
    expect(router.navigateByUrl).toHaveBeenCalled();
  });
});
