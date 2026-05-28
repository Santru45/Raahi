import { Routes } from '@angular/router';
import { HotelSearchComponent } from './hotel-search/hotel-search.component';
import { HotelDetailComponent } from './hotel-detail/hotel-detail.component';
import { HotelBookingSummaryComponent } from './hotel-booking-summary/hotel-booking-summary.component';
import { HotelMyBookingsComponent } from './hotel-my-bookings/hotel-my-bookings.component';
import { ReviewFormComponent } from './Review/review-form/review-form.component';

export const HotelRoutes: Routes = [
  { path: '', component: HotelSearchComponent },
  { path: 'booking-summary', component: HotelBookingSummaryComponent }, // ← move UP
  { path: 'my-bookings', component: HotelMyBookingsComponent }, // ← move UP
  { path: 'review/:entityId/write', component: ReviewFormComponent },
  { path: ':id', component: HotelDetailComponent }, // ← keep LAST
];
