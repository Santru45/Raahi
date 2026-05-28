import { Component, inject, OnInit } from '@angular/core';
import { ItineraryService } from '../itinerary.service';
import { Itinerary } from '../itinerary.model';
import { NgIf, NgForOf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ItineraryCardComponent } from '../itinerary-card/itinerary-card.component';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-itinerary',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    RouterLink,
    ItineraryCardComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './itinerary.component.html',
  styleUrl: './itinerary.component.scss',
})
export class ItineraryComponent implements OnInit {
  activeTab: 'std' | 'custom' =
    (sessionStorage.getItem('itinerary_active_tab') as 'std' | 'custom') ||
    'std';

  standardList: Itinerary[] = [];
  customList: Itinerary[] = [];
  showCreateForm = false;
  createForm!: FormGroup;
  today = new Date().toISOString().split('T')[0];

  private authService = inject(AuthService);

  get isLoggedIn(): boolean {
    return !!this.authService.getCurrentUser();
  }

  private get CURRENT_USER_ID(): string | null {
    return this.authService.getCurrentUser()?._id ?? null;
  }

  constructor(
    private itineraryService: ItineraryService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadItineraries();
  }

  initForm(): void {
    this.createForm = this.fb.group({
      trip_name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(60),
        ],
      ],
      destination: ['', Validators.maxLength(80)],
      image_url: ['', Validators.pattern(/^(https?:\/\/.*)?$/)],
    });
  }

  loadItineraries(): void {
    this.itineraryService.getItineraries().subscribe({
      next: (data) => {
        this.standardList = data.filter((item) => item.type === 'std');
        const userId = this.CURRENT_USER_ID;
        this.customList = userId
          ? data.filter(
              (item) => item.type === 'custom' && item.user_id === userId,
            )
          : [];
      },
      error: (err) => console.error('Could not load itineraries', err),
    });
  }

  setTab(tab: 'std' | 'custom'): void {
    this.activeTab = tab;
    sessionStorage.setItem('itinerary_active_tab', tab);
    this.showCreateForm = false;
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
  }

  onCreateSubmit(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.itineraryService
      .createItinerary(this.createForm.value, this.CURRENT_USER_ID!)
      .subscribe({
        next: () => {
          this.loadItineraries();
          this.createForm.reset();
          this.showCreateForm = false;
        },
        error: (err) => console.error('Failed to create itinerary', err),
      });
  }

  onDeleteItinerary(id: string): void {
    console.log('Deleting id:', id, typeof id);
    console.log(
      'customList ids:',
      this.customList.map((t) => ({
        id: t._id ?? t.id,
        type: typeof (t._id ?? t.id),
      })),
    );

    this.itineraryService.deleteItinerary(id).subscribe({
      next: () => {
        console.log('Delete success, filtering...');
        this.customList = this.customList.filter(
          (t) => String(t._id ?? t.id) !== String(id),
        );
        console.log('customList after filter:', this.customList);
      },
      error: (err) => console.error('Delete failed:', err),
    });
  }

  onImageFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.createForm.patchValue({ image_url: reader.result as string });
    };
    reader.readAsDataURL(file);
  }
}
