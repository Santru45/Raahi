// src/app/components/travel/travel.routes.ts

import { Routes } from '@angular/router';
import { TravelMainComponent } from './travel-main/travel-main.component';
import { TravelResultsComponent } from './travel-results/travel-results.component';
import { TravelBookingComponent } from './travel-booking/travel-booking.component';
import { BookingSuccessComponent } from './booking-success/booking-success.component';

export const TRAVEL_ROUTES: Routes = [
  {
    path: '',
    component: TravelMainComponent,
  },
  {
    path: 'results',
    component: TravelResultsComponent,
  },
  {
    path: 'booking',
    component: TravelBookingComponent,
  },
  {
    path: 'success',
    component:BookingSuccessComponent,
  }
];
