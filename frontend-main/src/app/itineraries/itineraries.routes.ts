import { Routes } from '@angular/router';
import { ItineraryComponent } from './itinerary/itinerary.component';
import { ItineraryDetailsComponent } from './itinerary-details/itinerary-details.component';

export const itinerariesRoutes: Routes = [
  { path: '', component: ItineraryComponent },
  { path: 'details/:id', component: ItineraryDetailsComponent },
];
