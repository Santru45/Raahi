import { Component, input } from '@angular/core';
import { statCardsData } from './stats';
import { DashboardStats } from '../dashboard.model';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [DecimalPipe, CurrencyPipe],
  templateUrl: './stats-cards.component.html',
  styleUrl: './stats-cards.component.scss',
})
export class StatsCardsComponent {
  stats = input.required<DashboardStats>();

  statCards = statCardsData;

  getValue(key: keyof DashboardStats): number {
    return this.stats()[key] as number;
  }

}
