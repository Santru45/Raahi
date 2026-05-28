import { Component, inject, OnInit, signal } from '@angular/core';
import { StatsService } from './stats.service';
import { HotelSummary } from '../booking/hotel.model';
import { AdminUser, DashboardStats } from './dashboard.model';
import { AdminBookingSummary } from '../booking/booking.model';
import { forkJoin } from 'rxjs';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { userCardsData } from './data/stats';
import { UserService } from '../profile/user.service';
import { StatsCardsComponent } from './stats-cards/stats-cards.component';
import { SuccessStoriesComponent } from './success-stories/success-stories.component';
import { avatarColors } from './avatar-color';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    CurrencyPipe,
    FormsModule,
    StatsCardsComponent,
    SuccessStoriesComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private statsService = inject(StatsService);
  private userService = inject(UserService);

  stats = signal<DashboardStats | null>(null);
  recentBookings: AdminBookingSummary[] = [];
  topHotels: HotelSummary[] = [];
  isLoading = true;
  serverError = '';
  deleteError = '';
  today = new Date();
  deleteConfirmId: string | null = null;
  showRevenueBreakdown = false;

  userCards = userCardsData;
  avatarColors = avatarColors;

  // User management
  users: AdminUser[] = [];
  userTotal = 0;
  userSearchQuery = '';
  sortKey: 'name' | 'bookings' | 'spent' = 'name';
  sortDir: 'asc' | 'desc' = 'asc';

  // Recent bookings
  bookingTotal = 0;
  bookingSearchQuery = '';
  bookingTypeFilter: 'all' | 'hotel' | 'flight' | 'train' | 'bus' = 'all';
  bookingStatusFilter: 'all' | 'confirmed' | 'cancelled' = 'all';
  bookingAmountSort: 'none' | 'asc' | 'desc' = 'none';

  // Top hotels filters
  hotelSearchQuery = '';
  hotelSortDir: 'asc' | 'desc' = 'desc';

  // Getters
  get filteredBookings(): AdminBookingSummary[] {
    let bookings = [...this.recentBookings];

    if (this.bookingSearchQuery.trim()) {
      const q = this.bookingSearchQuery.trim().toLowerCase();
      bookings = bookings.filter(
        (b) =>
          b.userName?.toLowerCase().includes(q) ||
          b.destination?.toLowerCase().includes(q),
      );
    }

    if (this.bookingTypeFilter !== 'all') {
      bookings = bookings.filter((b) => b.type === this.bookingTypeFilter);
    }

    if (this.bookingStatusFilter !== 'all') {
      bookings = bookings.filter(
        (b) => b.bookingStatus === this.bookingStatusFilter,
      );
    }

    if (this.bookingAmountSort === 'asc') {
      bookings.sort((a, b) => a.amount - b.amount);
    } else if (this.bookingAmountSort === 'desc') {
      bookings.sort((a, b) => b.amount - a.amount);
    }

    return bookings;
  }

  get filteredUsers(): AdminUser[] {
    let result = [...this.users];

    if (this.userSearchQuery.trim()) {
      const q = this.userSearchQuery.trim().toLowerCase();
      result = result.filter((u) => u.name?.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      let valA: number | string = a.name ?? '';
      let valB: number | string = b.name ?? '';

      if (this.sortKey === 'bookings') {
        valA = this.recentBookings.filter((bk) => bk.userId === a._id).length;
        valB = this.recentBookings.filter((bk) => bk.userId === b._id).length;
      } else if (this.sortKey === 'spent') {
        valA = this.recentBookings
          .filter((bk) => bk.userId === a._id)
          .reduce((s, bk) => s + (bk.amount ?? 0), 0);
        valB = this.recentBookings
          .filter((bk) => bk.userId === b._id)
          .reduce((s, bk) => s + (bk.amount ?? 0), 0);
      }

      if (typeof valA === 'string') {
        return this.sortDir === 'asc'
          ? valA.localeCompare(valB as string)
          : (valB as string).localeCompare(valA);
      }
      return this.sortDir === 'asc'
        ? valA - (valB as number)
        : (valB as number) - valA;
    });

    return result;
  }

  get filteredHotels() {
    let hotels = [...this.topHotels];

    if (this.hotelSearchQuery.trim()) {
      const q = this.hotelSearchQuery.trim().toLowerCase();
      hotels = hotels.filter((h) => h.name.toLowerCase().includes(q));
    }

    hotels.sort((a, b) =>
      this.hotelSortDir === 'desc'
        ? b.revenue - a.revenue
        : a.revenue - b.revenue,
    );

    return hotels;
  }

  get isBookingFiltered(): boolean {
    return (
      this.bookingSearchQuery.trim() !== '' ||
      this.bookingTypeFilter !== 'all' ||
      this.bookingStatusFilter !== 'all' ||
      this.bookingAmountSort !== 'none'
    );
  }

  // Lifecycle
  ngOnInit(): void {
    this.isLoading = true;
    this.serverError = '';
    forkJoin([
      this.statsService.getDashBoardStats(),
      this.statsService.getRecentBookings(),
      this.statsService.getTopHotels(),
      this.statsService.getUsers(),
    ]).subscribe({
      next: ([dashboardStats, bookings, top, users]) => {
        this.stats.set(dashboardStats);
        this.recentBookings = bookings;
        this.bookingTotal = bookings.length;
        this.topHotels = top;
        this.users = users;
        this.userTotal = users.length;
        setTimeout(() => (this.isLoading = false), 1000);
      },
      error: (err) => {
        console.log('DashBoard Error:', err);
        this.serverError = 'Internal server error. Please try later.';
        this.isLoading = false;
      },
    });
  }

  // Helpers
  confirmDeleteUser(id: string) {
    const userToDelete = this.users.find((u) => u._id === id);
    if (!userToDelete) return;

    this.userService.deleteUserById(id).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u._id !== id);
        this.userTotal = Math.max(0, this.userTotal - 1);
        const current = this.stats();
        if (current) {
          this.stats.set({
            ...current,
            totalUsers: current.totalUsers - 1,
            totalCustomers:
              userToDelete.role === 'customer'
                ? current.totalCustomers - 1
                : current.totalCustomers,
            totalAdmins:
              userToDelete.role === 'admin'
                ? current.totalAdmins - 1
                : current.totalAdmins,
          });
        }
        this.deleteConfirmId = null;
      },
      error: (err) => {
        console.error('Delete error status:', err.status);
        console.error('Delete error message:', err.error);
        this.deleteError = 'Failed to delete user. Please try later.';
        this.deleteConfirmId = null;
        setTimeout(() => (this.deleteError = ''), 4000);
      },
    });
  }
}
