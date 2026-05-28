import { Routes } from '@angular/router';

export const RECOMMENDATION_ROUTES: Routes = [
  {
    path: 'offer/:id',
    loadComponent: () =>
      import('./offer-details/offer-details.component').then(
        (m) => m.OfferDetailComponent
      )
  }
];

// add this default export — loadChildren needs this
export default RECOMMENDATION_ROUTES;