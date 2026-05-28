import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../auth.service';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild('loginForm') loginForm!: NgForm;

  formData = { email: '', password: '' };
  forgotEmail = '';
  showForgotForm = false;
  rememberMe = false;
  showPassword = false;
  showEmailRequired = false;
  showPasswordRequired = false;

  ngOnInit(): void {
    this.authService.authError.set('');
    if (this.authService.getCurrentUser()) {
      const returnUrl = localStorage.getItem('returnUrl') ?? '/';
      localStorage.removeItem('returnUrl');
      if (returnUrl && returnUrl !== '/') {
        this.router.navigateByUrl(returnUrl);
      } else {
        this.router.navigate(['/']);
      }
    }
  }

  handleFormSubmit(): void {
    const emailEmpty = !this.formData.email.trim();
    const passwordEmpty = !this.formData.password.trim();

    if (emailEmpty) this.showRequiredError('email');
    if (passwordEmpty) this.showRequiredError('password');
    if (emailEmpty || passwordEmpty) return;

    if (this.loginForm.invalid) return;

    this.authService.login(
      this.formData.email,
      this.formData.password,
      this.rememberMe,
    );
  }

  showRequiredError(field: 'email' | 'password'): void {
    if (field === 'email') {
      this.showEmailRequired = true;
      setTimeout(() => (this.showEmailRequired = false), 3000);
    } else {
      this.showPasswordRequired = true;
      setTimeout(() => (this.showPasswordRequired = false), 3000);
    }
  }

  clearError(): void {
    this.authService.authError.set('');
  }

  clearEmailRequired(): void {
    this.showEmailRequired = false;
  }

  clearPasswordRequired(): void {
    this.showPasswordRequired = false;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  sendPassword(): void {
    this.authService.getPasswordByEmail(this.forgotEmail);
    this.forgotEmail = '';
  }
}
