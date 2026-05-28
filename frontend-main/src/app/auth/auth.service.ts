import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../core/user.model';
import { LocalStorageService } from '../core/local-storage.service';
import { Router } from '@angular/router';
import { env } from '../../../.environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private storage = inject(LocalStorageService);
  private authUrl = env.baseUrl + '/auth';
  private storageKey = 'currentUser';

  user = signal<User | null>(null);
  authError = signal<string>('');
  isLoading = signal<boolean>(false);
  forgotPasswordOtp = signal<string>('');
  forgotPasswordEmail = signal<string>('');

  constructor() {
    const stored =
      localStorage.getItem(this.storageKey) ??
      sessionStorage.getItem(this.storageKey);
    if (stored) {
      this.user.set(JSON.parse(stored));
    }
  }

  private redirectAfterAuth(): void {
    const returnUrl = localStorage.getItem('returnUrl');
    localStorage.removeItem('returnUrl');
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/']);
    }
  }

  login(email: string, password: string, rememberMe: boolean = false) {
    this.authError.set('');
    this.isLoading.set(true);

    this.http
      .post<{
        user: User;
        token: string;
      }>(`${this.authUrl}/login`, { email, password, rememberMe })
      .subscribe({
        next: (response) => {
          const userData = response.user;
          const token = response.token;

          if (rememberMe) {
            this.storage.saveData(this.storageKey, JSON.stringify(userData));
            localStorage.setItem('authToken', token);
          } else {
            this.storage.saveDataSession(
              this.storageKey,
              JSON.stringify(userData),
            );
            sessionStorage.setItem('authToken', token);
          }
          this.user.set(userData);

          // Short delay before redirect
          setTimeout(() => {
            this.isLoading.set(false);
            this.redirectAfterAuth();
          }, 1500);
        },
        error: (err) => {
          console.log('Login error details:', err);

          const errorMessage = err.error?.message || '';

          if (errorMessage === 'Email not registered') {
            this.authError.set('email-not-found');
          } else if (errorMessage === 'Incorrect Password') {
            this.authError.set('wrong-password');
          } else {
            this.authError.set('server-error');
          }

          setTimeout(() => {
            this.isLoading.set(false);
            this.authError.set('');
          }, 2500);
        },
      });
  }

  signup(user: User) {
    this.isLoading.set(true);
    this.authError.set('');

    this.http
      .post<{
        user: User;
        message: string;
        token: string;
      }>(`${this.authUrl}/signup`, user)
      .subscribe({
        next: (response) => {
          this.user.set(response.user);
          this.storage.saveData(this.storageKey, JSON.stringify(response.user));
          if (response.token) {
            localStorage.setItem('authToken', response.token);
          }

          // Short delay before redirect
          setTimeout(() => {
            this.isLoading.set(false);
            this.redirectAfterAuth();
          }, 1500);
        },
        error: (err) => {
          console.log('Signup error:', err);
          const errorMsg =
            err.error?.message ||
            'Internal server error. Please try again later.';

          this.authError.set(errorMsg);

          setTimeout(() => {
            this.isLoading.set(false);
            setTimeout(() => this.authError.set(''), 2500);
          }, 1000);
        },
      });
  }

  getCurrentUser(): User | null {
    return this.user();
  }

  isLoggedIn(): boolean {
    return this.user() !== null;
  }

  logout() {
    this.user.set(null);
    this.storage.removeData(this.storageKey);
    this.storage.removeSessionData(this.storageKey);
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    this.router.navigate(['/login']);
  }

  sendForgotOtp(email: string): Promise<boolean> {
    this.authError.set('');
    return new Promise((resolve) => {
      this.http
        .post<{
          message: string;
          otp?: string;
        }>(`${this.authUrl}/forgot-password`, { email })
        .subscribe({
          next: (res: any) => {
            this.forgotPasswordEmail.set(email);
            if (res?.otp) {
              alert(
                `Your OTP is: ${res.otp}\n\nThis OTP expires in 10 minutes.`,
              );
            }
            resolve(true);
          },
          error: (err) => {
            this.authError.set(err.error?.message || 'Failed to send OTP');
            resolve(false);
          },
        });
    });
  }

  verifyForgotOtp(email: string, otp: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.http
        .post<{ message: string }>(`${this.authUrl}/verify-otp`, { email, otp })
        .subscribe({
          next: () => resolve(true),
          error: (err) => {
            this.authError.set(err.error?.message || 'Invalid OTP');
            resolve(false);
          },
        });
    });
  }

  resetForgotPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.http
        .post<{
          message: string;
        }>(`${this.authUrl}/reset-password`, { email, otp, newPassword })
        .subscribe({
          next: () => {
            this.authError.set('Password reset successfully');
            resolve(true);
          },
          error: (err) => {
            this.authError.set(err.error?.message || 'Reset failed');
            resolve(false);
          },
        });
    });
  }

  getPasswordByEmail(email: string) {
    this.authError.set('');

    this.http
      .get<User>(`${env.baseUrl}/users/by-email?email=${email}`)
      .subscribe({
        next: (user: any) => {
          if (!user) {
            this.authError.set('No account found with this email');
            setTimeout(() => this.authError.set(''), 1500);
            return;
          }

          console.log(`User found: ${user.email}`);
          this.authError.set('Instructions sent to your email');
          setTimeout(() => this.authError.set(''), 1500);
        },
        error: (err) => {
          this.authError.set(err.error?.message || 'Email verification failed');
          setTimeout(() => this.authError.set(''), 1500);
        },
      });
  }
}
