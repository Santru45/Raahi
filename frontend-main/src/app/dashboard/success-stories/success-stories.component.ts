import { Component, input } from '@angular/core';
import { DashboardStats } from '../dashboard.model';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { highlightCardsData } from './highlights-data';

@Component({
  selector: 'app-success-stories',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './success-stories.component.html',
  styleUrl: './success-stories.component.scss',
})
export class SuccessStoriesComponent {
  stats = input.required<DashboardStats>();
  topHotelName = input.required<string>();

  highlightCards = highlightCardsData;

  getValue(key: keyof DashboardStats | undefined): number {
    if (!key) return 0;
    return this.stats()[key] as number;
  }
}
