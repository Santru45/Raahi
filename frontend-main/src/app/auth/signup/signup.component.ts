import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../auth.service';
import { User } from '../../core/user.model';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// ── Custom Validators ──────────────────────────────────────────────────────────

function emailValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = (control.value ?? '').trim();
  const valid = /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(
    value,
  );
  return valid ? null : { invalidEmail: true };
}

function passwordStrengthValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value: string = control.value ?? '';
  const errors: ValidationErrors = {};
  if (value.length < 6) errors['minlength'] = true;
  if (!/[A-Z]/.test(value)) errors['noUpper'] = true;
  if (!/[a-z]/.test(value)) errors['noLower'] = true;
  if (!/\d/.test(value)) errors['noNumber'] = true;
  if (!/[^a-zA-Z\d\s]/.test(value)) errors['noSpecial'] = true;
  return Object.keys(errors).length ? errors : null;
}

function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const valid = /^[6-9][0-9]{9}$/.test(control.value ?? '');
  return valid ? null : { invalidPhone: true };
}

function nameValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = (control.value ?? '').trim();
  if (!value) return null; // required handles empty
  if (value.length < 2) return { nameTooShort: true };
  if (value.length > 50) return { nameTooLong: true };
  if (!/^[a-zA-Z\s]+$/.test(value)) return { nameInvalid: true };
  return null;
}

function passwordMatchValidator(
  group: AbstractControl,
): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const cpw = group.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
}

// ── Component ──────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent implements OnInit {
  authService = inject(AuthService);

  // CHANGED: show/hide toggles for both password fields
  showPassword = false;
  showConfirmPassword = false;

  // CHANGED: whether the password checklist panel is visible
  // (shown when user focuses the password field, hidden once all rules pass)
  showPasswordChecklist = false;

  // CHANGED: submit-only required error flags, auto-dismiss after 3s
  showNameRequired = false;
  showEmailRequired = false;
  showPhoneRequired = false;
  showPasswordRequired = false;
  showConfirmPasswordRequired = false;

  ngOnInit() {
    this.authService.authError.set('');
  }

  form = new FormGroup(
    {
      name: new FormControl('', [Validators.required, nameValidator]),
      email: new FormControl('', [Validators.required, emailValidator]),
      phone: new FormControl('', [Validators.required, phoneValidator]),
      password: new FormControl('', [
        Validators.required,
        passwordStrengthValidator,
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: passwordMatchValidator },
  );

  // CHANGED: each password rule check used by the checklist in the template
  get pw(): string {
    return this.passwordControl?.value ?? '';
  }
  get ruleMinLength(): boolean {
    return this.pw.length >= 6;
  }
  get ruleUpper(): boolean {
    return /[A-Z]/.test(this.pw);
  }
  get ruleLower(): boolean {
    return /[a-z]/.test(this.pw);
  }
  get ruleNumber(): boolean {
    return /\d/.test(this.pw);
  }
  get ruleSpecial(): boolean {
    return /[^a-zA-Z\d\s]/.test(this.pw);
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

  onSubmit() {
    let hasEmpty = false;

    if (!this.form.get('name')?.value?.trim()) {
      this.triggerRequired('name');
      hasEmpty = true;
    }
    if (!this.form.get('email')?.value?.trim()) {
      this.triggerRequired('email');
      hasEmpty = true;
    }
    if (!this.form.get('phone')?.value?.trim()) {
      this.triggerRequired('phone');
      hasEmpty = true;
    }
    if (!this.form.get('password')?.value?.trim()) {
      this.triggerRequired('password');
      hasEmpty = true;
    }
    if (!this.form.get('confirmPassword')?.value?.trim()) {
      this.triggerRequired('confirmPassword');
      hasEmpty = true;
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const newUser: Omit<User, '_id'> = {
      name: this.toTitleCase(this.form.value.name!),
      email: this.form.value.email!.trim().toLowerCase(),
      phone: this.form.value.phone!,
      passwordHash: this.form.value.password!,
      role: 'customer',
      isActive: true,
      loyaltyAccountId: null,
    };
    this.authService.signup(newUser as User);
  }

  // CHANGED: triggers a timed required error flag, auto-clears after 3s
  triggerRequired(field: string): void {
    const ms = 3000;
    switch (field) {
      case 'name':
        this.showNameRequired = true;
        setTimeout(() => (this.showNameRequired = false), ms);
        break;
      case 'email':
        this.showEmailRequired = true;
        setTimeout(() => (this.showEmailRequired = false), ms);
        break;
      case 'phone':
        this.showPhoneRequired = true;
        setTimeout(() => (this.showPhoneRequired = false), ms);
        break;
      case 'password':
        this.showPasswordRequired = true;
        setTimeout(() => (this.showPasswordRequired = false), ms);
        break;
      case 'confirmPassword':
        this.showConfirmPasswordRequired = true;
        setTimeout(() => (this.showConfirmPasswordRequired = false), ms);
        break;
    }
  }

  // CHANGED: strips any non-digit characters as the user types in the phone field
  onlyNumbers(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '');
    if (input.value !== cleaned) {
      input.value = cleaned;
      this.phoneControl?.setValue(cleaned, { emitEvent: true });
    }
  }

  onlyLetters(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/[^a-zA-Z\s]/g, '');
    if (input.value !== cleaned) {
      input.value = cleaned;
      this.nameControl?.setValue(cleaned, { emitEvent: true });
    }
  }

  // ── Getters ──────────────────────────────────────────────────────────────────
  get nameControl() {
    return this.form.get('name');
  }
  get emailControl() {
    return this.form.get('email');
  }
  get phoneControl() {
    return this.form.get('phone');
  }
  get passwordControl() {
    return this.form.get('password');
  }
  get confirmPasswordControl() {
    return this.form.get('confirmPassword');
  }
  get passwordMismatch(): boolean {
    return (
      !!this.form.errors?.['passwordMismatch'] &&
      !!this.confirmPasswordControl?.touched
    );
  }

  private toTitleCase(str: string): string {
    return str
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
