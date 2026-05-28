import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgForOf, TitleCasePipe, Location } from '@angular/common';
// Update the import path below to match the actual location and filename of the StarRatingComponent
// For example, if the file is named 'star-rating.component.ts' and is in the same folder:
 
import { Review, Subratings } from '../review.model';
import { UserService } from '../user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../auth/auth.service';
import { StarRatingComponent } from './star-rating/star-rating.component';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [FormsModule, StarRatingComponent, NgForOf, TitleCasePipe, NgIf],
  templateUrl: './review-form.component.html',
  styleUrl: './review-form.component.scss',
})
export class ReviewFormComponent {
  route = inject(ActivatedRoute);
  userservice = inject(UserService);
  router = inject(Router);
  private auth = inject(AuthService);
  get userId(): string {
    return this.auth.getCurrentUser()?._id ?? '';
  }
  hasRatingError = false;
  promptId = this.route.snapshot.queryParamMap.get('promptId') ?? '';
  hotelId = String(this.route.snapshot.paramMap.get('entityId'));
  entitytype = this.route.snapshot.queryParamMap.get('entityType') || 'hotel';
  imageBase64s: string[] = [];
  imageError = '';
  comment = '';

  rating = 0;
  isSubmitting = false;
  showSuccessModal = false;

  categories: (keyof Subratings)[] = [
    'cleanliness',
    'service',
    'location',
    'food',
    'facilities',
    'staff',
  ];

  subratings: Subratings = {
    cleanliness: 0,
    service: 0,
    location: 0,
    food: 0,
    facilities: 0,
    staff: 0,
  };
  private location = inject(Location);

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.imageBase64s = [];
    this.imageError = '';

    if (files.length > 5) {
      this.imageError = 'Max 5 images allowed.';
      return;
    }

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        this.imageError = 'Only image files are allowed.';
        return;
      }

      // Compress image before converting to base64
      this.compressImage(file)
        .then((compressedBase64) => {
          this.imageBase64s.push(compressedBase64);
        })
        .catch((err) => {
          console.error('Image compression failed:', err);
          this.imageError = 'Failed to process image. Try a smaller file.';
        });
    });
  }

  private compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Max dimensions: 800px (reduced from 1200px)
          let width = img.width;
          let height = img.height;
          const maxSize = 800;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with 0.5 quality (more aggressive compression)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.imageBase64s.splice(index, 1);
  }

  async onsubmit(form: any): Promise<void> {
    const allRated = Object.values(this.subratings).every((v) => v > 0);
    if (!allRated) {
      this.hasRatingError = true;
      return;
    }
    this.hasRatingError = false;

    const sum = Object.values(this.subratings).reduce((a, v) => a + v, 0) / 6;
    this.rating = parseFloat(sum.toFixed(1));

    const existingReviews = await firstValueFrom(
      this.userservice.getReviewByUserAndEntity(this.userId, this.hotelId),
    );

    const isUpdate = existingReviews.length > 0;

    const review: Review = {
      userId: this.userId,
      entityId: this.hotelId,
      entityType: this.entitytype,
      rating: this.rating,
      comment: form.value.comment,
      year: new Date().getFullYear(),
      images: this.imageBase64s,
      isVerified: true,
      createdAt: new Date().toISOString(),
      subrating: this.subratings,
    };

    this.isSubmitting = true;
    const save$ = isUpdate
      ? this.userservice.updatereview(review) // uses userId + entityId
      : this.userservice.addreview(review);

    save$.subscribe({
      next: () => {
        if (this.promptId) {
          // came from prompt banner — mark it reviewed
          this.userservice.markPromptReviewed(this.promptId).subscribe();
        }
        this.isSubmitting = false;
        this.showSuccessModal = true;
        // Redirect after 2 seconds
        setTimeout(() => {
          this.showSuccessModal = false;
          this.location.back();
        }, 2000);
      },
      error: (err) => {
        this.isSubmitting = false;
        err.status === 409
          ? alert('You have already reviewed this hotel.')
          : alert('Submission failed. Please try again.');
      },
    });
  }
}
