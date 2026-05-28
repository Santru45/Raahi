import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HotelService } from '../hotel.service';
import { Hotel } from '../model/hotel.model';

@Component({
  selector: 'app-hotel-listing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hotel-listing.component.html',
  styleUrls: ['./hotel-listing.component.scss'],
})
export class HotelListingComponent implements OnInit {
  @Input() checkIn: string = '';
  @Input() checkOut: string = '';
  @Input() rooms: number = 1;
  @Input() adults: number = 1;
  @Input() children: number = 0;
  @Input() infants: number = 0;

  @Input() hotels: Hotel[] = [];
  @Input() roomPriceMap: { [hotelId: string]: number } = {};
  reviewCounts: { [hotelId: string]: number } = {};

  private hotelService = inject(HotelService);
  private router = inject(Router);

  ngOnInit(): void {
    this.hotels.forEach((hotel) => {
      this.hotelService.getTotalreview(hotel._id).subscribe((count) => {
        this.reviewCounts[hotel._id] = count;
      });
    });
  }

  // Price per night for ALL requested rooms combined
  getTotalStartingPrice(hotel: Hotel): number {
    return (this.roomPriceMap[hotel._id] || 0) * this.rooms;
  }

  // Total people excluding infants (infants don't count toward occupancy)
  get totalGuests(): number {
    return this.adults + this.children;
  }

  viewDetail(hotel: Hotel): void {
    this.router.navigate(['/hotel', hotel._id], {
      queryParams: {
        checkIn:  this.checkIn,
        checkOut: this.checkOut,
        rooms:    this.rooms,
        adults:   this.adults,
        children: this.children,
        infants:  this.infants,
      },
    });
  }
}