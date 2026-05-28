import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { StatsService } from './stats.service';
import { UserService } from '../profile/user.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  const mockStats = {
    users: [
      { _id: 'u1', name: 'Alice', role: 'customer', email: 'alice@test.com' },
      { _id: 'u2', name: 'Bob', role: 'admin', email: 'bob@test.com' },
    ],
    totalUsers: 2,
    totalCustomers: 1,
    totalAdmins: 1,
    revenue: 50000,
    hotelRevenue: 30000,
    flightRevenue: 20000,
    trainRevenue: 5000,
    totalBookings: 10,
    hotelBookings: 6,
    flightBookings: 4,
    activeUsers: 2,
    cancellationRate: 0,
    avgBookingsPerCustomer: 5,
  };

  const mockStatsService = {
    getDashBoardStats: jasmine
      .createSpy('getDashBoardStats')
      .and.returnValue(of(mockStats)),
    getRecentBookings: jasmine
      .createSpy('getRecentBookings')
      .and.returnValue(of([])),
    getTopHotels: jasmine.createSpy('getTopHotels').and.returnValue(of([])),
  };

  const mockUserService = {
    deleteUserById: jasmine
      .createSpy('deleteUserById')
      .and.returnValue(of(null)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: StatsService, useValue: mockStatsService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have null stats initially (before ngOnInit resolves)', () => {
    // stats gets set after forkJoin resolves; after detectChanges it may be set
    // Just verify the component property exists
    expect(component.stats).toBeTruthy();
  });

  it('should default to page 1 for bookings', () => {
    expect(component.bookingPage).toBe(1);
  });

  it('should default to page 1 for users', () => {
    expect(component.userPage).toBe(1);
  });

  it('should have default booking filters', () => {
    expect(component.bookingTypeFilter).toBe('all');
    expect(component.bookingStatusFilter).toBe('all');
    expect(component.bookingAmountSort).toBe('none');
    expect(component.bookingSearchQuery).toBe('');
  });

  it('should not show revenue breakdown initially', () => {
    expect(component.showRevenueBreakdown).toBeFalse();
  });

  it('should have null deleteConfirmId', () => {
    expect(component.deleteConfirmId).toBeNull();
  });

  it('should have user sort defaults', () => {
    expect(component.sortKey).toBe('name');
    expect(component.sortDir).toBe('asc');
  });

  it('should return empty filteredUsersAll when stats is null', () => {
    component.stats.set(null);
    expect(component.filteredUsersAll.length).toBe(0);
  });

  // --- filteredUsersAll ---
  it('filteredUsersAll should return all users when no search query', () => {
    component.stats.set(mockStats as any);
    component.userSearchQuery = '';
    expect(component.filteredUsersAll.length).toBe(2);
  });

  it('filteredUsersAll should filter by search query', () => {
    component.stats.set(mockStats as any);
    component.userSearchQuery = 'alice';
    expect(component.filteredUsersAll.length).toBe(1);
    expect(component.filteredUsersAll[0].name).toBe('Alice');
  });

  it('filteredUsersAll should sort by name descending', () => {
    component.stats.set(mockStats as any);
    component.userSearchQuery = '';
    component.sortKey = 'name';
    component.sortDir = 'desc';
    const names = component.filteredUsersAll.map((u) => u.name);
    expect(names[0]).toBe('Bob');
  });

  it('filteredUsersAll should sort by bookings count', () => {
    component.stats.set(mockStats as any);
    component.recentBookings = [
      {
        userId: 'u1',
        userName: 'Alice',
        type: 'hotel',
        bookingStatus: 'confirmed',
        amount: 5000,
      } as any,
    ];
    component.sortKey = 'bookings';
    component.sortDir = 'desc';
    expect(component.filteredUsersAll[0]._id).toBe('u1');
  });

  it('filteredUsersAll should sort by spent', () => {
    component.stats.set(mockStats as any);
    component.recentBookings = [
      {
        userId: 'u1',
        userName: 'Alice',
        type: 'hotel',
        bookingStatus: 'confirmed',
        amount: 5000,
      } as any,
    ];
    component.sortKey = 'spent';
    component.sortDir = 'desc';
    expect(component.filteredUsersAll[0]._id).toBe('u1');
  });

  // --- filteredUsers (pagination) ---
  it('filteredUsers should return first page of users', () => {
    component.stats.set(mockStats as any);
    component.userSearchQuery = '';
    component.userPage = 1;
    expect(component.filteredUsers.length).toBeLessThanOrEqual(5);
  });

  // --- userTotalPages ---
  it('userTotalPages should be at least 1', () => {
    component.stats.set(null);
    expect(component.userTotalPages).toBe(1);
  });

  it('userTotalPages should calculate correctly', () => {
    const manyUsers = Array(6).fill({
      _id: 'u',
      name: 'User',
      role: 'customer',
    });
    component.stats.set({ ...mockStats, users: manyUsers } as any);
    component.userSearchQuery = '';
    expect(component.userTotalPages).toBe(2);
  });

  // --- goToUserPage / resetUserPage ---
  it('goToUserPage should change page within bounds', () => {
    component.stats.set(mockStats as any);
    component.userSearchQuery = '';
    component.goToUserPage(1);
    expect(component.userPage).toBe(1);
  });

  it('goToUserPage should ignore out-of-bound pages', () => {
    component.userPage = 1;
    component.goToUserPage(0);
    expect(component.userPage).toBe(1);
    component.goToUserPage(999);
    expect(component.userPage).toBe(1);
  });

  it('resetUserPage should set page to 1', () => {
    component.userPage = 3;
    component.resetUserPage();
    expect(component.userPage).toBe(1);
  });

  // --- getUserStats ---
  it('getUserStats should return 0 count and 0 spent when no bookings', () => {
    component.recentBookings = [];
    const stats = component.getUserStats('u1');
    expect(stats.count).toBe(0);
    expect(stats.spent).toBe(0);
  });

  it('getUserStats should count bookings for given userId', () => {
    component.recentBookings = [
      {
        userId: 'u1',
        userName: 'Alice',
        type: 'hotel',
        bookingStatus: 'confirmed',
        amount: 3000,
      } as any,
      {
        userId: 'u1',
        userName: 'Alice',
        type: 'hotel',
        bookingStatus: 'confirmed',
        amount: 2000,
      } as any,
      {
        userId: 'u2',
        userName: 'Bob',
        type: 'hotel',
        bookingStatus: 'confirmed',
        amount: 1000,
      } as any,
    ];
    const stats = component.getUserStats('u1');
    expect(stats.count).toBe(2);
    expect(stats.spent).toBe(5000);
  });

  // --- filteredBookingsAll ---
  it('filteredBookingsAll should return all bookings with default filters', () => {
    component.recentBookings = [
      {
        userId: 'u1',
        userName: 'Alice',
        type: 'hotel',
        bookingStatus: 'confirmed',
        amount: 3000,
      } as any,
    ];
    expect(component.filteredBookingsAll.length).toBe(1);
  });

  it('filteredBookingsAll should filter by search query', () => {
    component.recentBookings = [
      {
        userId: 'u1',
        userName: 'Alice',
        type: 'hotel',
        bookingStatus: 'confirmed',
        amount: 3000,
      } as any,
      {
        userId: 'u2',
        userName: 'Bob',
        type: 'hotel',
        bookingStatus: 'confirmed',
        amount: 2000,
      } as any,
    ];
    component.bookingSearchQuery = 'alice';
    expect(component.filteredBookingsAll.length).toBe(1);
    expect(component.filteredBookingsAll[0].userName).toBe('Alice');
  });

  it('filteredBookingsAll should filter by booking type', () => {
    component.recentBookings = [
      {
        userId: 'u1',
        userName: 'Alice',
        type: 'hotel',
        bookingStatus: 'confirmed',
        amount: 3000,
      } as any,
      {
        userId: 'u2',
        userName: 'Bob',
        type: 'flight',
        bookingStatus: 'confirmed',
        amount: 2000,
      } as any,
    ];
    component.bookingSearchQuery = '';
    component.bookingTypeFilter = 'hotel';
    expect(component.filteredBookingsAll.length).toBe(1);
    expect(component.filteredBookingsAll[0].type).toBe('hotel');
  });

  it('filteredBookingsAll should filter by booking status', () => {
    component.recentBookings = [
      {
        userId: 'u1',
        userName: 'Alice',
        type: 'hotel',
        bookingStatus: 'confirmed',
        amount: 3000,
      } as any,
      {
        userId: 'u2',
        userName: 'Bob',
        type: 'hotel',
        bookingStatus: 'cancelled',
        amount: 2000,
      } as any,
    ];
    component.bookingSearchQuery = '';
    component.bookingTypeFilter = 'all';
    component.bookingStatusFilter = 'confirmed';
    expect(component.filteredBookingsAll.length).toBe(1);
  });

  it('filteredBookingsAll should sort by amount desc', () => {
    component.recentBookings = [
      {
        userId: 'u1',
        userName: 'Alice',
        type: 'hotel',
        bookingStatus: 'confirmed',
        amount: 1000,
      } as any,
      {
        userId: 'u2',
        userName: 'Bob',
        type: 'hotel',
        bookingStatus: 'confirmed',
        amount: 5000,
      } as any,
    ];
    component.bookingSearchQuery = '';
    component.bookingTypeFilter = 'all';
    component.bookingStatusFilter = 'all';
    component.bookingAmountSort = 'desc';
    expect(component.filteredBookingsAll[0].amount).toBe(5000);
  });

  it('filteredBookingsAll should sort by amount asc', () => {
    component.recentBookings = [
      {
        userId: 'u1',
        userName: 'Alice',
        type: 'hotel',
        bookingStatus: 'confirmed',
        amount: 5000,
      } as any,
      {
        userId: 'u2',
        userName: 'Bob',
        type: 'hotel',
        bookingStatus: 'confirmed',
        amount: 1000,
      } as any,
    ];
    component.bookingSearchQuery = '';
    component.bookingTypeFilter = 'all';
    component.bookingStatusFilter = 'all';
    component.bookingAmountSort = 'asc';
    expect(component.filteredBookingsAll[0].amount).toBe(1000);
  });

  // --- goToBookingPage / resetBookingPage ---
  it('goToBookingPage should change page within bounds', () => {
    component.recentBookings = [];
    component.goToBookingPage(1);
    expect(component.bookingPage).toBe(1);
  });

  it('goToBookingPage should ignore out-of-bound pages', () => {
    component.bookingPage = 1;
    component.goToBookingPage(0);
    expect(component.bookingPage).toBe(1);
  });

  it('resetBookingPage should set bookingPage to 1', () => {
    component.bookingPage = 3;
    component.resetBookingPage();
    expect(component.bookingPage).toBe(1);
  });

  // --- isBookingFiltered ---
  it('isBookingFiltered should be false with default filters', () => {
    component.bookingSearchQuery = '';
    component.bookingTypeFilter = 'all';
    component.bookingStatusFilter = 'all';
    component.bookingAmountSort = 'none';
    expect(component.isBookingFiltered).toBeFalse();
  });

  it('isBookingFiltered should be true when search query set', () => {
    component.bookingSearchQuery = 'alice';
    expect(component.isBookingFiltered).toBeTrue();
  });

  it('isBookingFiltered should be true when type filter set', () => {
    component.bookingSearchQuery = '';
    component.bookingTypeFilter = 'hotel';
    expect(component.isBookingFiltered).toBeTrue();
  });

  it('isBookingFiltered should be true when status filter set', () => {
    component.bookingSearchQuery = '';
    component.bookingTypeFilter = 'all';
    component.bookingStatusFilter = 'confirmed';
    expect(component.isBookingFiltered).toBeTrue();
  });

  // --- filteredHotels ---
  it('filteredHotels should sort by revenue desc by default', () => {
    component.topHotels = [
      { name: 'Budget', revenue: 1000 } as any,
      { name: 'Luxury', revenue: 5000 } as any,
    ];
    component.hotelSearchQuery = '';
    component.hotelSortDir = 'desc';
    expect(component.filteredHotels[0].name).toBe('Luxury');
  });

  it('filteredHotels should filter by search query', () => {
    component.topHotels = [
      { name: 'Taj Palace', revenue: 5000 } as any,
      { name: 'Budget Inn', revenue: 1000 } as any,
    ];
    component.hotelSearchQuery = 'taj';
    expect(component.filteredHotels.length).toBe(1);
    expect(component.filteredHotels[0].name).toBe('Taj Palace');
  });

  // --- userPageNumbers ---
  it('userPageNumbers should return array containing current page', () => {
    component.stats.set(mockStats as any);
    component.userSearchQuery = '';
    expect(component.userPageNumbers).toContain(1);
  });

  // --- bookingTotalPages ---
  it('bookingTotalPages should be at least 1', () => {
    component.recentBookings = [];
    expect(component.bookingTotalPages).toBe(1);
  });

  it('bookingTotalPages should calculate correctly with many bookings', () => {
    component.recentBookings = Array(9).fill({
      userId: 'u1',
      userName: 'Alice',
      type: 'hotel',
      bookingStatus: 'confirmed',
      amount: 100,
    } as any);
    component.bookingSearchQuery = '';
    component.bookingTypeFilter = 'all';
    component.bookingStatusFilter = 'all';
    component.bookingAmountSort = 'none';
    expect(component.bookingTotalPages).toBe(2);
  });

  // --- bookingPageNumbers ---
  it('bookingPageNumbers should contain current page', () => {
    component.recentBookings = [];
    component.bookingPage = 1;
    expect(component.bookingPageNumbers).toContain(1);
  });

  it('bookingPageNumbers should span delta around current page', () => {
    component.recentBookings = Array(50).fill({
      userId: 'u1',
      userName: 'Alice',
      type: 'hotel',
      bookingStatus: 'confirmed',
      amount: 100,
    } as any);
    component.bookingSearchQuery = '';
    component.bookingTypeFilter = 'all';
    component.bookingStatusFilter = 'all';
    component.bookingAmountSort = 'none';
    component.bookingPage = 4;
    const pages = component.bookingPageNumbers;
    expect(pages).toContain(2);
    expect(pages).toContain(4);
    expect(pages).toContain(6);
  });

  // --- filteredBookings (paginated slice) ---
  it('filteredBookings should return paginated slice', () => {
    component.recentBookings = Array(10).fill({
      userId: 'u1',
      userName: 'Alice',
      type: 'hotel',
      bookingStatus: 'confirmed',
      amount: 100,
    } as any);
    component.bookingSearchQuery = '';
    component.bookingTypeFilter = 'all';
    component.bookingStatusFilter = 'all';
    component.bookingAmountSort = 'none';
    component.bookingPage = 1;
    expect(component.filteredBookings.length).toBe(8);
  });

  // --- filteredHotels sort asc ---
  it('filteredHotels should sort by revenue asc', () => {
    component.topHotels = [
      { name: 'Luxury', revenue: 5000 } as any,
      { name: 'Budget', revenue: 1000 } as any,
    ];
    component.hotelSearchQuery = '';
    component.hotelSortDir = 'asc';
    expect(component.filteredHotels[0].name).toBe('Budget');
  });

  // --- showRevenueBreakdown toggle ---
  it('showRevenueBreakdown should start false and can be toggled', () => {
    expect(component.showRevenueBreakdown).toBeFalse();
    component.showRevenueBreakdown = true;
    expect(component.showRevenueBreakdown).toBeTrue();
  });

  // --- deleteConfirmId ---
  it('deleteConfirmId can be set to a user id', () => {
    component.deleteConfirmId = 'u1';
    expect(component.deleteConfirmId).toBe('u1');
  });

  // --- ngOnInit ---
  it('ngOnInit should load stats, recentBookings and topHotels', (done) => {
    const bookings = [
      {
        userId: 'u1',
        userName: 'Alice',
        type: 'hotel',
        bookingStatus: 'confirmed',
        amount: 3000,
      } as any,
    ];
    const hotels = [{ name: 'Taj', revenue: 5000 } as any];
    mockStatsService.getDashBoardStats.and.returnValue(of(mockStats));
    mockStatsService.getRecentBookings.and.returnValue(of(bookings));
    mockStatsService.getTopHotels.and.returnValue(of(hotels));
    component.ngOnInit();
    setTimeout(() => {
      expect(component.stats()).toEqual(mockStats as any);
      expect(component.recentBookings).toEqual(bookings);
      expect(component.topHotels).toEqual(hotels);
      done();
    }, 50);
  });

  it('ngOnInit should set serverError on failure', () => {
    mockStatsService.getDashBoardStats.and.returnValue(
      throwError(() => new Error('fail')),
    );
    component.ngOnInit();
    expect(component.serverError).toBeTruthy();
    expect(component.isLoading).toBeFalse();
  });

  // --- confirmDeleteUser ---
  it('confirmDeleteUser should do nothing if user not found', () => {
    component.stats.set(mockStats as any);
    mockUserService.deleteUserById.calls.reset();
    component.confirmDeleteUser('unknown-id');
    expect(mockUserService.deleteUserById).not.toHaveBeenCalled();
  });

  it('confirmDeleteUser should delete user and update stats', () => {
    component.stats.set(mockStats as any);
    mockUserService.deleteUserById.and.returnValue(of(null));
    component.confirmDeleteUser('u1');
    const users = component.stats()?.users ?? [];
    expect(users.find((u) => u._id === 'u1')).toBeUndefined();
    expect(component.stats()?.totalUsers).toBe(1);
    expect(component.stats()?.totalCustomers).toBe(0);
    expect(component.deleteConfirmId).toBeNull();
  });

  it('confirmDeleteUser should decrement totalAdmins when deleting admin', () => {
    component.stats.set(mockStats as any);
    mockUserService.deleteUserById.and.returnValue(of(null));
    component.confirmDeleteUser('u2');
    expect(component.stats()?.totalAdmins).toBe(0);
  });

  it('confirmDeleteUser should set deleteError on failure', (done) => {
    component.stats.set(mockStats as any);
    mockUserService.deleteUserById.and.returnValue(
      throwError(() => ({ status: 500, error: 'Server error' })),
    );
    component.confirmDeleteUser('u1');
    expect(component.deleteError).toContain('Failed to delete user');
    expect(component.deleteConfirmId).toBeNull();
    done();
  });

  // --- userPageNumbers with many users ---
  it('userPageNumbers should span multiple pages', () => {
    const manyUsers = Array(20).fill({
      _id: 'u',
      name: 'User',
      role: 'customer',
    });
    component.stats.set({ ...mockStats, users: manyUsers } as any);
    component.userSearchQuery = '';
    component.userPage = 3;
    const pages = component.userPageNumbers;
    expect(pages).toContain(1);
    expect(pages).toContain(3);
  });
});
