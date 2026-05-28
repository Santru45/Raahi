import { Component, inject, Input } from '@angular/core';
import { Hotel, Offer, RecommendationItem } from '../user.model';
import { CurrencyPipe, NgIf } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hotel-card',
  standalone: true,
  imports: [CurrencyPipe, NgIf],
  templateUrl: './hotel-card.component.html',
  styleUrl: './hotel-card.component.scss',
})
export class HotelCardComponent {
  @Input() item!: RecommendationItem;
  router = inject(Router);
 viewdetail(h: Hotel): void {
  const hotelId = h.id ?? h._id;
  this.router.navigate(['/hotel', hotelId]);
}

grabdeal(offer: Offer): void {
  const offerId = offer.id ?? offer._id;
  console.log('offerId:', offerId);
  console.log('full offer:', offer);
  this.router.navigate(['/recommendation/offer', offerId]).then(
    success => console.log('success:', success),
    error   => console.log('error:', error)
  );
}
}
