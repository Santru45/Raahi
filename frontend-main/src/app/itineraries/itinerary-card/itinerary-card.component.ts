import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Itinerary } from '../itinerary.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-itinerary-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './itinerary-card.component.html',
  styleUrl: './itinerary-card.component.scss',
})
export class ItineraryCardComponent {
  @Input() data!: Itinerary;
  @Output() delete = new EventEmitter<string>();

  confirmDelete = false;
  imgError = false;

  get imgSrc(): string {
    return !this.imgError && this.data?.images?.[0] ? this.data.images[0] : '';
  }

  onImgError(): void {
    this.imgError = true;
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.confirmDelete) {
      this.delete.emit(this.data._id ?? this.data.id);
    } else {
      this.confirmDelete = true;
    }
  }

  cancelDelete(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.confirmDelete = false;
  }
}
