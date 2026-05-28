// src/app/components/travel/passenger-form/passenger-form.component.ts

import { Component, inject, OnInit, output } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormArray,
  FormGroup,
  Validators,
} from '@angular/forms';
import { TransportService } from '../../travel.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-passenger-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './passenger-form.component.html',
  styleUrl: './passenger-form.component.scss',
})
export class PassengerFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  transportService = inject(TransportService);

  // Notify parent (TravelBookingComponent) that form is submitted
  submitted = output<void>();

  passengerForm!: FormGroup;
  termsAccepted = false;
  showTermsModal = false;

  ngOnInit(): void {
    const count = this.transportService.passengerCount();
    const existingData = this.transportService.passengerData();
    const passengerForms = [];

    for (let i = 0; i < count; i++) {
      const form = this.createPassenger();

      // Primary passenger (index 0) — require phone and email
      if (i === 0) {
        form
          .get('phone')
          ?.setValidators([
            Validators.required,
            Validators.pattern(/^[6-9]\d{4}\s?\d{5}$/),
          ]);
        form
          .get('email')
          ?.setValidators([Validators.required, Validators.email]);
        form.get('phone')?.updateValueAndValidity();
        form.get('email')?.updateValueAndValidity();
      }

      if (existingData[i]) {
        form.patchValue(existingData[i]);
      }
      passengerForms.push(form);
    }

    this.passengerForm = this.fb.group({
      passengers: this.fb.array(passengerForms),
    });
  }

  // Regex patterns for ID validation (allow spaces for formatted display)
  private idPatterns: { [key: string]: RegExp } = {
    Aadhaar: /^\d{4}\s?\d{4}\s?\d{4}$/,
    Passport: /^[A-Z]\d{7}$/,
    PAN: /^[A-Z]{5}\d{4}[A-Z]$/,
    'Driving License': /^[A-Z]{2}\d{13}$/,
  };

  createPassenger(): FormGroup {
    const group = this.fb.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z\s]+$/),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z\s]+$/),
        ],
      ],
      age: [
        '',
        [
          Validators.required,
          Validators.min(1),
          Validators.max(120),
          Validators.pattern(/^\d+$/),
        ],
      ],
      gender: ['', Validators.required],
      idType: ['Aadhaar', Validators.required],
      idNumber: ['', [Validators.required, Validators.pattern(/^\d{4}\s?\d{4}\s?\d{4}$/)]],
      phone: [''],
      email: [''],
      berthPreference: [''],
    });

    // Listen for idType changes to update idNumber validation
    group.get('idType')?.valueChanges.subscribe((idType) => {
      const idNumberControl = group.get('idNumber');
      const pattern =
        idType && this.idPatterns[idType as string]
          ? this.idPatterns[idType as string]
          : /^.+$/;
      idNumberControl?.setValidators([
        Validators.required,
        Validators.pattern(pattern),
      ]);
      idNumberControl?.updateValueAndValidity();
    });

    return group;
  }

  // Get age category label
  getAgeCategory(index: number): string {
    const age = this.passengers.at(index).get('age')?.value;
    if (!age) return '';
    if (age <= 2) return 'Infant';
    if (age <= 11) return 'Child';
    return 'Adult';
  }

  // Get ID number placeholder based on type
  getIdPlaceholder(index: number): string {
    const idType = this.passengers.at(index).get('idType')?.value;
    switch (idType) {
      case 'Aadhaar':
        return 'XXXX XXXX XXXX';
      case 'Passport':
        return 'e.g. K1234567';
      case 'PAN':
        return 'e.g. ABCDE1234F';
      case 'Driving License':
        return 'e.g. TN0120190012345';
      default:
        return 'Enter ID number';
    }
  }

  // Get error message for a field
  getError(index: number, field: string): string {
    const control = this.passengers.at(index).get(field);
    if (!control?.touched || !control?.errors) return '';

    if (control.errors['required']) {
      switch (field) {
        case 'firstName':
          return 'First name is required';
        case 'lastName':
          return 'Last name is required';
        case 'age':
          return 'Age is required';
        case 'gender':
          return 'Please select gender';
        case 'idNumber':
          return 'ID number is required';
        case 'phone':
          return 'Phone number is required';
        case 'email':
          return 'Email is required';
        default:
          return 'This field is required';
      }
    }
    if (control.errors['minlength']) {
      return `Minimum ${control.errors['minlength'].requiredLength} characters`;
    }
    if (control.errors['maxlength']) {
      return `Maximum ${control.errors['maxlength'].requiredLength} characters`;
    }
    if (control.errors['min']) {
      return `Minimum value is ${control.errors['min'].min}`;
    }
    if (control.errors['max']) {
      return `Maximum value is ${control.errors['max'].max}`;
    }
    if (control.errors['email']) {
      return 'Enter a valid email address';
    }
    if (control.errors['pattern']) {
      switch (field) {
        case 'firstName':
        case 'lastName':
          return 'Only letters and spaces allowed';
        case 'age':
          return 'Enter a valid whole number';
        case 'idNumber':
          const idType = this.passengers.at(index).get('idType')?.value;
          switch (idType) {
            case 'Aadhaar':
              return 'Aadhaar must be exactly 12 digits';
            case 'Passport':
              return 'Format: 1 letter + 7 digits (e.g. K1234567)';
            case 'PAN':
              return 'Format: ABCDE1234F (5 letters + 4 digits + 1 letter)';
            case 'Driving License':
              return 'Format: 2 letters + 13 digits';
            default:
              return 'Invalid format';
          }
        case 'phone':
          return 'Enter valid 10-digit Indian mobile number';
        case 'email':
          return 'Enter a valid email address';
        default:
          return 'Invalid format';
      }
    }
    return '';
  }

  get passengers(): FormArray {
    return this.passengerForm.get('passengers') as FormArray;
  }

  addPassenger(): void {
    this.passengers.push(this.createPassenger());
  }

  removePassenger(index: number): void {
    if (this.passengers.length > 1) {
      this.passengers.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.passengerForm.invalid || !this.termsAccepted) {
      this.passengerForm.markAllAsTouched();
      return;
    }

    // Strip formatting from phone and idNumber before saving
    const passengerData = this.passengers.value.map((p: any) => ({
      ...p,
      phone: p.phone ? p.phone.replace(/\s/g, '') : '',
      idNumber: p.idNumber ? p.idNumber.replace(/\s/g, '') : '',
    }));
    this.transportService.passengerData.set(passengerData);
    this.submitted.emit();
  }

  // Format ID number based on type
  onIdNumberInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const idType = this.passengers.at(index).get('idType')?.value;
    let raw = input.value;

    if (idType === 'Aadhaar') {
      raw = raw.replace(/\D/g, '').slice(0, 12);
      const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      input.value = formatted;
      this.passengers.at(index).get('idNumber')?.setValue(formatted, { emitEvent: false });
    } else if (idType === 'PAN') {
      raw = raw.replace(/[^A-Za-z0-9]/g, '').slice(0, 10).toUpperCase();
      input.value = raw;
      this.passengers.at(index).get('idNumber')?.setValue(raw, { emitEvent: false });
    } else if (idType === 'Passport') {
      raw = raw.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase();
      input.value = raw;
      this.passengers.at(index).get('idNumber')?.setValue(raw, { emitEvent: false });
    } else if (idType === 'Driving License') {
      raw = raw.replace(/[^A-Za-z0-9]/g, '').slice(0, 15).toUpperCase();
      input.value = raw;
      this.passengers.at(index).get('idNumber')?.setValue(raw, { emitEvent: false });
    }
  }

  // Format phone as 5-5 digits
  onPhoneInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    let raw = input.value.replace(/\D/g, '').slice(0, 10);
    const formatted = raw.length > 5 ? raw.slice(0, 5) + ' ' + raw.slice(5) : raw;
    input.value = formatted;
    this.passengers.at(index).get('phone')?.setValue(formatted, { emitEvent: false });
  }

  acceptTerms(): void {
    this.termsAccepted = true;
    this.showTermsModal = false;
  }
}
