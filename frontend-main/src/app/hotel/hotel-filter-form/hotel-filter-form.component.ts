import { Component, EventEmitter, Input, OnInit, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HotelService } from '../hotel.service';

@Component({
  selector: 'app-hotel-filter-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './hotel-filter-form.component.html',
  styleUrl: './hotel-filter-form.component.scss',
})
export class HotelFilterFormComponent implements OnInit, OnChanges {

  maxPrice:            number   = 20000;
  selectedStar:        number | null = null;
  selectedAmenities:   string[] = [];
  selectedHotelTypes:  string[] = [];
  searchText:          string   = '';

  amenities:   string[] = [];
  hotelTypes:  string[] = [];

  showAllAmenities:  boolean = false;
  showAllHotelTypes: boolean = false;

  // receives saved filter state from parent
  @Input() savedFilter?: {
    maxPrice:   number;
    starRating: number | null;
    amenities:  string[];
    hotelTypes: string[];
    searchText: string;
  };

  private hotelService = inject(HotelService);
  @Output() filterChanged = new EventEmitter<any>();

  ngOnInit(): void {
    this.hotelService.getAmenities().subscribe((data) => (this.amenities = data));
    this.hotelService.getHotelType().subscribe((data) => (this.hotelTypes = data));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['savedFilter'] && this.savedFilter) {
      this.maxPrice           = this.savedFilter.maxPrice;
      this.selectedStar       = this.savedFilter.starRating;
      this.selectedAmenities  = [...this.savedFilter.amenities];
      this.selectedHotelTypes = [...this.savedFilter.hotelTypes];
      this.searchText         = this.savedFilter.searchText || '';
    }
  }

  onFilterChange(): void {
    this.filterChanged.emit({
      maxPrice:   this.maxPrice,
      starRating: this.selectedStar,
      amenities:  this.selectedAmenities,
      hotelTypes: this.selectedHotelTypes,
      searchText: this.searchText,
    });
  }

  toggleAmenity(amenity: string): void {
    const i = this.selectedAmenities.indexOf(amenity);
    i > -1 ? this.selectedAmenities.splice(i, 1) : this.selectedAmenities.push(amenity);
    this.onFilterChange();
  }

  toggleHotelType(type: string): void {
    const i = this.selectedHotelTypes.indexOf(type);
    i > -1 ? this.selectedHotelTypes.splice(i, 1) : this.selectedHotelTypes.push(type);
    this.onFilterChange();
  }

  get visibleAmenities(): string[] {
    return this.showAllAmenities ? this.amenities : this.amenities.slice(0, 4);
  }

  get visibleHotelTypes(): string[] {
    return this.showAllHotelTypes ? this.hotelTypes : this.hotelTypes.slice(0, 4);
  }
}