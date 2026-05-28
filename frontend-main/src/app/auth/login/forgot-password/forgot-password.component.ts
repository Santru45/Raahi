import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  step: 'email' | 'otp' | 'reset' = 'email';
  email = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';
  isSubmitting = false;
  isResending = false;
  resendCooldown = 0;
  private resendTimer: any = null;

  showNewPassword = false;
  showConfirmPassword = false;

  showEmailRequired = false;
  showOtpRequired = false;
  showNewPasswordRequired = false;
  showConfirmPasswordRequired = false;
  showPasswordMismatch = false;
  showPasswordChecklist = false;

  get ruleMinLength(): boolean {
    return this.newPassword.length >= 6;
  }
  get ruleUpper(): boolean {
    return /[A-Z]/.test(this.newPassword);
  }
  get ruleLower(): boolean {
    return /[a-z]/.test(this.newPassword);
  }
  get ruleNumber(): boolean {
    return /[0-9]/.test(this.newPassword);
  }
  get ruleSpecial(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.newPassword);
  }
  get allRulesMet(): boolean {
    return (
      this.ruleMinLength &&
      this.ruleUpper &&
      this.ruleLower &&
      this.ruleNumber &&
      this.ruleSpecial
    );
  }

  async sendOtp() {
    if (!this.email.trim()) {
      this.triggerError('emailRequired');
      return;
    }
    this.isSubmitting = true;
    const ok = await this.authService.sendForgotOtp(this.email);
    this.isSubmitting = false;
    if (ok) {
      this.step = 'otp';
      this.startResendCooldown();
    }
  }

  startResendCooldown(seconds = 30) {
    this.resendCooldown = seconds;
    if (this.resendTimer) clearInterval(this.resendTimer);
    this.resendTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.resendTimer);
        this.resendTimer = null;
      }
    }, 1000);
  }

  async resendOtp() {
    if (this.resendCooldown > 0 || this.isResending) return;
    this.isResending = true;
    this.authService.authError.set('');
    await this.authService.sendForgotOtp(this.email);
    this.isResending = false;
    this.startResendCooldown();
  }

  async verifyOtp() {
    if (!this.otp.trim()) {
      this.triggerError('otpRequired');
      return;
    }
    this.isSubmitting = true;
    const ok = await this.authService.verifyForgotOtp(this.email, this.otp);
    this.isSubmitting = false;
    if (ok) {
      this.authService.authError.set('');
      this.step = 'reset';
    }
  }

  async resetPassword() {
    let hasError = false;
    if (!this.newPassword.trim()) {
      this.triggerError('newPasswordRequired');
      hasError = true;
    }
    if (!this.confirmPassword.trim()) {
      this.triggerError('confirmPasswordRequired');
      hasError = true;
    }
    if (hasError) return;
    if (this.newPassword !== this.confirmPassword) {
      this.triggerError('passwordMismatch');
      return;
    }
    if (!this.allRulesMet) {
      this.authService.authError.set('password-too-short');
      return;
    }

    this.isSubmitting = true;
    const ok = await this.authService.resetForgotPassword(
      this.email,
      this.otp,
      this.newPassword,
    );
    this.isSubmitting = false;
    if (ok) {
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
  }

  triggerError(type: string): void {
    const duration = 3000;
    switch (type) {
      case 'emailRequired':
        this.showEmailRequired = true;
        setTimeout(() => (this.showEmailRequired = false), duration);
        break;
      case 'otpRequired':
        this.showOtpRequired = true;
        setTimeout(() => (this.showOtpRequired = false), duration);
        break;
      case 'newPasswordRequired':
        this.showNewPasswordRequired = true;
        setTimeout(() => (this.showNewPasswordRequired = false), duration);
        break;
      case 'confirmPasswordRequired':
        this.showConfirmPasswordRequired = true;
        setTimeout(() => (this.showConfirmPasswordRequired = false), duration);
        break;
      case 'passwordMismatch':
        this.showPasswordMismatch = true;
        setTimeout(() => (this.showPasswordMismatch = false), duration);
        break;
    }
  }

  clearAuthError(): void {
    this.authService.authError.set('');
  }

  goBack() {
    this.step = 'email';
    this.authService.authError.set('');
    this.otp = '';
  }
}
