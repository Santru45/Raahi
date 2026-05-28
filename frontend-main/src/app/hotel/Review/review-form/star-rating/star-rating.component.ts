import { Component, EventEmitter, Output, output } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { NgFor } from '@angular/common';
@Component({
  selector: 'star-rating',
  standalone: true,
  imports: [NgFor],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss'],
})
export class StarRatingComponent {
  stars: number[] = [1, 2, 3, 4, 5];
  @Output() rated = new EventEmitter<number>();
  hover: number = 0;
  selected: number = 0;

  onHover(star: number, event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    this.hover = percent < 0.5 ? star - 0.5 : star;
  }
  onClick(star: number, event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;

    this.selected = percent < 0.5 ? star - 0.5 : star;
    this.rated.emit(this.selected);
  }
  floor(value: number): number {
    return Math.floor(value);
  }

  ceil(value: number): number {
    return Math.ceil(value);
  }
}
