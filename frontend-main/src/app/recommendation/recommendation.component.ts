import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  AfterViewInit,
  OnInit,
  ViewChild,
} from '@angular/core';
import { HotelCardComponent } from './hotel-card/hotel-card.component';
import { NgFor, NgIf } from '@angular/common';
import { RecommendationItem } from './user.model';
import { RecommendService } from './service/recommend.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-recommendation',
  standalone: true,
  imports: [HotelCardComponent, NgFor, NgIf],
  templateUrl: './recommendation.component.html',
  styleUrl: './recommendation.component.scss',
})
export class RecommendationComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('scrollRef') scrollRef!: ElementRef<HTMLDivElement>;
  isLoading = true;
  hotels: RecommendationItem[] = [];
  service = inject(RecommendService);
  private authService = inject(AuthService);

  private animFrameId = 0;
  private isHovered = false;

  ngOnInit(): void {
    const userId = this.authService.getCurrentUser()?._id;
    this.service.getRecommendation(userId).subscribe({
      next: (hotels) => {
        this.hotels = hotels;
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }
  // it runs after ngOnInit, 
  ngAfterViewInit(): void {
    this.startAutoScroll();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animFrameId);
  }

  onMouseEnter(): void {
    this.isHovered = true;
  }
  onMouseLeave(): void {
    this.isHovered = false;
  }

  private startAutoScroll(): void {
    // take scrollable element into it
    const el = this.scrollRef.nativeElement;

    const step = () => {
      if (!this.isHovered) {
        el.scrollLeft += 1;
        // reset at halfway — both sets look identical so no visible jump
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      // helps to run step function contiuosly before the next screen repaint
      this.animFrameId = requestAnimationFrame(step);
    };
  // kick-off the start to step 
    this.animFrameId = requestAnimationFrame(step);
  }
}
