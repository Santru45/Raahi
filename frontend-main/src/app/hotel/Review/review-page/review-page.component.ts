import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ReviewComponent } from '../review/review.component';
import { Reviewwithname } from '../review.model';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { UserService } from '../user.service';
 
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-review-page',
  standalone: true,
  imports: [ReviewComponent, NgFor, NgIf],
  templateUrl: './review-page.component.html',
  styleUrl: './review-page.component.scss',
})
export class ReviewPageComponent implements OnInit, OnChanges {
  userservice = inject(UserService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  private auth = inject(AuthService);

  reviews: Reviewwithname[] = [];
  displayedReviews: Reviewwithname[] = [];
  avgRating = 0;
  totalReviews = 0;
  isLoading = true;
  sortBy: 'date' | 'rating' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  @Input() entityId: string = '';
  @Input() entityType: string = '';
  get userId(): string {
    return this.auth.getCurrentUser()?._id ?? '';
  }
  canReview = false;

  ngOnInit(): void {
    // Page reloads on location.back() - no need for optimistic updates
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entityId'] && this.entityId) {
      this.loadReviews();
    }
  }

  private loadReviews(): void {
    this.isLoading = true;

    // single call — backend returns reviews + avgRating + total
    this.userservice.getReviewsWithName(this.entityId).subscribe({
      next: ({ reviews, avgRating, total }) => {
        this.reviews = reviews;
        this.avgRating = avgRating;
        this.totalReviews = total;
        this.applySorting();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('getReviewsWithName error:', err);
        this.isLoading = false;
      },
    });

    // check if user can review — has confirmed/completed booking
    this.userservice.checkvalidation(this.userId, this.entityId).subscribe({
      next: (bookings) => {
        this.canReview = bookings.length > 0;
        console.log('checkvalidation bookings:', bookings);
      },
      error: (err) => console.error('checkvalidation error:', err),
    });
  }

  applySorting(): void {
    this.displayedReviews = [...this.reviews].sort((a, b) => {
      let comparison = 0;
  // Safe sorting - handle null/undefined dates or ratings
      if (this.sortBy === 'date') {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        comparison = dateA - dateB;
      } else {
        comparison = a.rating - b.rating;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  toggleSort(field: 'date' | 'rating'): void {
    if (this.sortBy === field) {
      // if clicking same field, toggle order
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // if changing sort field, default to descending (newest or highest first)
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.applySorting();
  }

  render(): void {
    this.router.navigate(['/hotel/review', this.entityId, 'write'], {
      queryParams: { entityType: this.entityType },
    });
  }
}
