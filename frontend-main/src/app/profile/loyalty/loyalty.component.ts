import { Component, inject, Input, OnInit } from '@angular/core';
import { DatePipe, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { LoyaltyAccount } from './loyalty-service';
import { FormsModule } from '@angular/forms';
import { LoyaltyService } from './loyalty-service';

@Component({
  selector: 'app-loyalty',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, TitleCasePipe, FormsModule],
  templateUrl: './loyalty.component.html',
  styleUrl: './loyalty.component.scss',
})
export class LoyaltyComponent implements OnInit {
  @Input() userId!: string;
  noAccount = false;
  account!: LoyaltyAccount;
  service = inject(LoyaltyService);

  milestones = [
    { label: 'Bronze', minCoins: 0, icon: 'bi-award', multiplier: 1 },
    { label: 'Silver', minCoins: 200, icon: 'bi-trophy', multiplier: 1.5 },
    { label: 'Gold', minCoins: 600, icon: 'bi-trophy-fill', multiplier: 2 },
    { label: 'Platinum', minCoins: 1500, icon: 'bi-gem', multiplier: 3 },
  ];

  progressPercent = 0;
  nextMilestone: any;
  remainingToNext = 0;
  transactionFilter: 'all' | 'earned' | 'redeemed' | 'deducted' = 'all';

  ngOnInit(): void {
    // getLoyaltyByUser auto-cleans expired coins
    this.service.getByUserId(this.userId).subscribe({
      next: (account) => {
        if (!account) {
          this.noAccount = true;
          return;
        }
        this.account = account;
        this.calculateProgress();
      },
      error: (err) => {
        console.error('Loyalty account error:', err);
        this.noAccount = true;
      },
    });
  }

  calculateProgress(): void {
    // calculate all the progress logic here based on totalEarned and milestones
    const total = this.account.totalEarned;
    const segmentWidth = 100 / (this.milestones.length - 1);
    const nextIndex = this.milestones.findIndex((m) => m.minCoins > total);
    // if nextIndex is -1, it means user has surpassed all milestones, so we set progress to 100% and no next milestone
    if (nextIndex === -1) {
      this.progressPercent = 100;
      this.nextMilestone = null;
      this.remainingToNext = 0;
    } else {
      const prev = this.milestones[nextIndex - 1];
      const next = this.milestones[nextIndex];
      this.nextMilestone = next;
      this.remainingToNext = next.minCoins - total;
      const segmentProgress =
        (total - prev.minCoins) / (next.minCoins - prev.minCoins);
      this.progressPercent =
        (nextIndex - 1) * segmentWidth + segmentProgress * segmentWidth;
    }
  }

  isReached(minCoins: number): boolean {
    return this.account?.totalEarned >= minCoins;
  }

  get filteredTransactions() {
    if (!this.account?.ledger) return [];

    const ledger = this.account.ledger.slice().reverse();

    if (this.transactionFilter === 'all') {
      return ledger;
    } else if (this.transactionFilter === 'earned') {
      return ledger.filter(
        (e) => e.action === 'earned' || e.action === 'refunded',
      );
    } else if (this.transactionFilter === 'redeemed') {
      return ledger.filter((e) => e.action === 'redeemed');
    } else if (this.transactionFilter === 'deducted') {
      return ledger.filter((e) => e.action === 'clawback');
    }
    return ledger;
  }

  setFilter(filter: 'all' | 'earned' | 'redeemed' | 'deducted'): void {
    this.transactionFilter = filter;
  }
}
