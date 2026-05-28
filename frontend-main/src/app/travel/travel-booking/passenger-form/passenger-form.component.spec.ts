import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PassengerFormComponent } from './passenger-form.component';
import { TransportService } from '../../travel.service';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';

describe('PassengerFormComponent', () => {
  let fixture: ComponentFixture<PassengerFormComponent>;
  let component: PassengerFormComponent;
  let transportService: jasmine.SpyObj<TransportService>;

  const passengerCount = signal(1);
  const passengerData = signal<any[]>([]);

  beforeEach(async () => {
    transportService = jasmine.createSpyObj('TransportService', [], {
      passengerCount,
      passengerData,
    });

    await TestBed.configureTestingModule({
      imports: [PassengerFormComponent, ReactiveFormsModule],
      providers: [{ provide: TransportService, useValue: transportService }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PassengerFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should build passengerForm on init', () => {
    expect(component.passengerForm).toBeDefined();
    expect(component.passengers.length).toBe(1);
  });

  it('should add a passenger', () => {
    component.addPassenger();
    expect(component.passengers.length).toBe(2);
  });

  it('should remove a passenger if more than 1 exist', () => {
    component.addPassenger();
    expect(component.passengers.length).toBe(2);
    component.removePassenger(1);
    expect(component.passengers.length).toBe(1);
  });

  it('should not remove last passenger', () => {
    component.removePassenger(0);
    expect(component.passengers.length).toBe(1);
  });

  it('should not submit if form invalid', () => {
    spyOn(component.submitted, 'emit');
    component.onSubmit();
    expect(component.submitted.emit).not.toHaveBeenCalled();
  });

  it('should not submit if terms not accepted', () => {
    spyOn(component.submitted, 'emit');
    component.passengerForm.setValue({
      passengers: [
        {
          firstName: 'John',
          lastName: 'Doe',
          age: '25',
          gender: 'male',
          idType: 'Aadhaar',
          idNumber: '1234 5678 9012',
          phone: '98765 43210',
          email: 'j@j.com',
          berthPreference: '',
        },
      ],
    });
    component.termsAccepted = false;
    component.onSubmit();
    expect(component.submitted.emit).not.toHaveBeenCalled();
  });

  it('should emit submitted on valid form with terms accepted', () => {
    spyOn(component.submitted, 'emit');
    component.passengers.at(0).setValue({
      firstName: 'John',
      lastName: 'Doe',
      age: '25',
      gender: 'male',
      idType: 'Aadhaar',
      idNumber: '1234 5678 9012',
      phone: '98765 43210',
      email: 'j@j.com',
      berthPreference: '',
    });
    component.termsAccepted = true;
    component.onSubmit();
    expect(component.submitted.emit).toHaveBeenCalled();
  });

  it('should set passengerData on valid submit', () => {
    component.passengers.at(0).setValue({
      firstName: 'John',
      lastName: 'Doe',
      age: '25',
      gender: 'male',
      idType: 'Aadhaar',
      idNumber: '1234 5678 9012',
      phone: '98765 43210',
      email: 'j@j.com',
      berthPreference: '',
    });
    component.termsAccepted = true;
    component.onSubmit();
    expect(passengerData()).toBeDefined();
  });

  it('should accept terms and close modal on acceptTerms', () => {
    component.showTermsModal = true;
    component.acceptTerms();
    expect(component.termsAccepted).toBeTrue();
    expect(component.showTermsModal).toBeFalse();
  });

  it('should return age category Adult for age 25', () => {
    component.passengers.at(0).patchValue({ age: '25' });
    expect(component.getAgeCategory(0)).toBe('Adult');
  });

  it('should return age category Child for age 8', () => {
    component.passengers.at(0).patchValue({ age: '8' });
    expect(component.getAgeCategory(0)).toBe('Child');
  });

  it('should return age category Infant for age 1', () => {
    component.passengers.at(0).patchValue({ age: '1' });
    expect(component.getAgeCategory(0)).toBe('Infant');
  });

  it('should return correct ID placeholder for Aadhaar', () => {
    component.passengers.at(0).patchValue({ idType: 'Aadhaar' });
    expect(component.getIdPlaceholder(0)).toBe('XXXX XXXX XXXX');
  });

  it('should return correct ID placeholder for Passport', () => {
    component.passengers.at(0).patchValue({ idType: 'Passport' });
    expect(component.getIdPlaceholder(0)).toBe('e.g. K1234567');
  });

  it('should return required error message for firstName', () => {
    const ctrl = component.passengers.at(0).get('firstName')!;
    ctrl.setValue('');
    ctrl.markAsTouched();
    expect(component.getError(0, 'firstName')).toBe('First name is required');
  });

  it('should patch existing passenger data on init', async () => {
    await TestBed.resetTestingModule();
    const existing = [
      {
        firstName: 'Jane',
        lastName: 'Doe',
        age: '30',
        gender: 'female',
        idType: 'Aadhaar',
        idNumber: '9876 5432 1098',
        phone: '',
        email: '',
        berthPreference: '',
      },
    ];
    const ts = jasmine.createSpyObj('TransportService', [], {
      passengerCount: signal(1),
      passengerData: signal(existing),
    });

    await TestBed.configureTestingModule({
      imports: [PassengerFormComponent, ReactiveFormsModule],
      providers: [{ provide: TransportService, useValue: ts }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    const f = TestBed.createComponent(PassengerFormComponent);
    f.detectChanges();
    expect(f.componentInstance.passengers.at(0).get('firstName')?.value).toBe(
      'Jane',
    );
  });
});
