import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { adminGuard } from './core/admin.guard';
import { HomeComponent } from './home/home.component';
import { nonAdminGuard } from './auth/non-admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./auth/signup/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'travel',
    canActivate: [nonAdminGuard],
    loadChildren: () =>
      import('./travel/travel.route').then((m) => m.TRAVEL_ROUTES),
  },
  {
    path: 'hotel',
    canActivate: [nonAdminGuard],
    loadChildren: () =>
      import('./hotel/hotel.routes').then((m) => m.HotelRoutes),
  },
  {
    path: 'itinerary',
    loadChildren: () =>
      import('./itineraries/itineraries.routes').then(
        (m) => m.itinerariesRoutes,
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
    canActivate: [authGuard, adminGuard],
  },

  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./auth/login/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'recommendation',
    loadChildren: () =>
      import('./recommendation/recommendation.routes').then(
        (m) => m.RECOMMENDATION_ROUTES,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./not-found/not-found.component').then((m) => {
        console.log(m);
        return m.NotFoundComponent;
      }),
  },
];
