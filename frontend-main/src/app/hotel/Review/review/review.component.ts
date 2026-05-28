import { Component, Input } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { Reviewwithname } from '../review.model';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [NgFor, DatePipe, NgIf],
  templateUrl: './review.component.html',
  styleUrl: './review.component.scss',
})
export class ReviewComponent {
  @Input() review!: Reviewwithname;

  stars = [1, 2, 3, 4, 5];
  selectedImage: string | null = null;

  floor(value: number): number {
    return Math.floor(value);
  }

  ceil(value: number): number {
    return Math.ceil(value);
  }

  hasHalfStar(value: number, star: number): boolean {
    return !Number.isInteger(value) && star === Math.ceil(value);
  }

  openImage(img: string): void {
    this.selectedImage = img;
  }

  closeImage(): void {
    this.selectedImage = null;
  }
}
