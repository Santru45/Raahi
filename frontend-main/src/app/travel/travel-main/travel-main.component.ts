// src/app/components/travel/travel-main/travel-main.component.ts

import { Component, inject, computed, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TravelSearchComponent } from './travel-search/travel-search.component';
import { TransportService } from '../travel.service';

@Component({
  selector: 'app-travel-main',
  standalone: true,
  imports: [TravelSearchComponent],
  templateUrl: './travel-main.component.html',
  styleUrl: './travel-main.component.scss',
})
export class TravelMainComponent implements OnInit {
  public transportService = inject(TransportService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const mode = this.route.snapshot.queryParamMap.get('mode') as
      | 'flight'
      | 'train'
      | 'bus'
      | null;
    if (mode && ['flight', 'train', 'bus'].includes(mode)) {
      this.transportService.selectedMode.set(mode);
    }
  }

  // Dynamic background image based on selected mode
  backgroundImage = computed(() => {
    const mode = this.transportService.selectedMode();
    const images = {
      flight: 'assets/images/travel/flight-bg.jpg',
      train: 'assets/images/travel/train-bg.webp',
      bus: 'assets/images/travel/bus-bg.jpg',
    };
    return images[mode];
  });
}
