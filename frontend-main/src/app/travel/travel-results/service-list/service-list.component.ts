// src/app/components/travel/service-list/service-list.component.ts

import { Component, inject, input, output } from '@angular/core';
import { TransportService } from '../../travel.service';
import { TravelService } from '../../travel.model';
import { ServiceCardComponent } from './service-card/service-card.component';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [ServiceCardComponent],
  templateUrl: './service-list.component.html',
  styleUrl: './service-list.component.scss',
})
export class ServiceListComponent {
  transportService = inject(TransportService);
  trips = input<TravelService[]>([]);
  tripSelected = output<TravelService>();

  onTripSelected(trip: TravelService): void {
    this.tripSelected.emit(trip);
  }
}
