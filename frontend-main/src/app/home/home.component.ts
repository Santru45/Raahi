import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HotelService } from '../hotel/hotel.service';
import { TransportService } from '../travel/travel.service';
import { RecommendationComponent } from '../recommendation/recommendation.component';
import { ReviewPromptComponent } from '../hotel/review-prompt/review-prompt.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RecommendationComponent,
    ReviewPromptComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private hotelService = inject(HotelService);
  private transportService = inject(TransportService);

  destinations: {
    city: string;
    country: string;
    image: string;
    count: number;
  }[] = [
    {
      city: 'New Delhi',
      country: 'India',
      image:
        'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80',
      count: 2,
    },
    {
      city: 'Goa',
      country: 'India',
      image:
        'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=600&q=80',
      count: 3,
    },
    {
      city: 'Mumbai',
      country: 'India',
      image:
        'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=600&q=80',
      count: 2,
    },
    {
      city: 'Jaipur',
      country: 'India',
      image:
        'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80',
      count: 2,
    },
  ];

  ngOnInit(): void {
    // Clear all search and booking states when user lands on home page
    // This gives them a fresh start
    this.hotelService.clearSearchState();
    this.hotelService.clearBookingState();
    this.transportService.clearSearchResults();
    this.transportService.clearBookingState();
  }

  goToDestination(city: string): void {
    this.router.navigate(['/hotel'], {
      queryParams: {
        destination: city,
      },
    });
  }
}
