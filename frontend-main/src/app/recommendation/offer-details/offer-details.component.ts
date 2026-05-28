import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgFor, NgIf, DatePipe, CurrencyPipe } from '@angular/common';
import { Hotel, Offer } from '../user.model';
import { RecommendService } from '../service/recommend.service';

@Component({
  selector: 'app-offer-detail',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, CurrencyPipe],
  templateUrl: './offer-details.component.html',
  styleUrl: './offer-details.component.scss',
})
export class OfferDetailComponent implements OnInit {
  offer!: Offer;
  hotels: Hotel[] = [];

  route = inject(ActivatedRoute);
  router = inject(Router);
  recommendservice = inject(RecommendService);

  ngOnInit(): void {
    const offerId = this.route.snapshot.paramMap.get('id')!;
     if (!offerId) {
    this.router.navigate(['/']);
    return;
  }
    this.recommendservice.getOfferWithHotels(offerId).subscribe({
      next: ({ offer, hotels }) => {
        this.offer = offer;
        this.hotels = hotels;
      },
      error: () => this.router.navigate(['/'])  
    });
  }

  goToHotel(hotelId: string): void {
    // pass coupon to hotel page via router state
    this.router.navigate(['/hotel', hotelId], {
      state: {
        couponCode: this.offer.couponCode,
        discountPercent: this.offer.discountPercent,
        offerId: this.offer.id,
        minNights:this.offer.minNights
      },
    });
  }
}
