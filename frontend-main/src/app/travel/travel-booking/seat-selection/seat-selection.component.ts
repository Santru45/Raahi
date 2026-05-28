// src/app/components/travel/seat-selection/seat-selection.component.ts

import { Component, inject, OnInit, output } from '@angular/core';
import { TransportService } from '../../travel.service';
import { TravelDAO } from '../../travel.dao';

export interface Seat {
  id: string;
  row: number;
  column: string;
  deck: 'lower' | 'upper' | 'single';
  status: 'available' | 'taken' | 'taken-female' | 'selected';
  position: 'window' | 'aisle' | 'middle';
}

type LayoutType = 'bus-seater' | 'bus-sleeper' | 'flight';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [],
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.scss',
})
export class SeatSelectionComponent implements OnInit {
  transportService = inject(TransportService);
  private travelDao = inject(TravelDAO);
  seatConfirmed = output<string[]>();
  isLoading = true;
  lowerDeck: Seat[][] = [];
  upperDeck: Seat[][] = [];
  selectedSeats: string[] = [];
  maxSeats: number = 1;
  layout: LayoutType = 'bus-seater';
  mode: 'bus' | 'flight' = 'bus';

  layoutConfig = {
    'bus-seater': {
      columns: ['A', 'B', 'C', 'D'],
      seatsPerRow: 4,
      aisleAfter: 1,
    },
    'bus-sleeper': { columns: ['A', 'B', 'C'], seatsPerRow: 3, aisleAfter: 0 },
    flight: {
      columns: ['A', 'B', 'C', 'D', 'E', 'F'],
      seatsPerRow: 6,
      aisleAfter: 2,
    },
  };

  ngOnInit(): void {
    const trip = this.transportService.selectedTrip();
    if (!trip || trip.type === 'train') return;

    this.mode = trip.type === 'flight' ? 'flight' : 'bus';
    this.layout = this.detectLayout(trip.type, trip.cabinClass);
    this.maxSeats = Number(this.transportService.passengerCount()); //Changed - explicit conversion to Number
    //this.generateSeats(trip.totalSeats, trip.availableSeats);

    this.travelDao.getBookedSeats(trip._id).subscribe({
      next: (bookedSeats) => {
        this.generateSeats(trip.totalSeats, bookedSeats);
        this.isLoading = false;
      },
      error: () => {
        this.generateSeats(trip.totalSeats, []);
        this.isLoading = false;
      },
    });
  }

  get config() {
    return this.layoutConfig[this.layout];
  }

  get isSleeper(): boolean {
    return this.layout === 'bus-sleeper';
  }

  get seatsRemaining(): number {
    return this.maxSeats - this.selectedSeats.length;
  }

  get allSeatsSelected(): boolean {
    return this.selectedSeats.length === this.maxSeats;
  }

  detectLayout(type: string, cabinClass: string): LayoutType {
    if (type === 'flight') return 'flight';
    const cls = cabinClass.toLowerCase();
    if (cls.includes('sleeper')) return 'bus-sleeper';
    return 'bus-seater';
  }

  generateSeats(totalSeats: number, bookedSeats: any[]): void {
    const { seatsPerRow } = this.config;

    const bookedMap = new Map<string, string>();
    bookedSeats.forEach((bs) => bookedMap.set(bs.seatId, bs.gender));

    if (this.isSleeper) {
      const seatsPerDeck = Math.ceil(totalSeats / 2);
      const rowsPerDeck = Math.ceil(seatsPerDeck / seatsPerRow);
      const allSeats: Seat[] = [];

      for (let r = 1; r <= rowsPerDeck; r++) {
        for (let c = 0; c < seatsPerRow; c++) {
          const seat = this.createSeat(r, this.config.columns[c], 'lower');
          this.applySeatStatus(seat, bookedMap);
          allSeats.push(seat);
        }
      }
      for (let r = 1; r <= rowsPerDeck; r++) {
        for (let c = 0; c < seatsPerRow; c++) {
          const seat = this.createSeat(r, this.config.columns[c], 'upper');
          this.applySeatStatus(seat, bookedMap);
          allSeats.push(seat);
        }
      }

      const lowerSeats = allSeats.filter((s) => s.deck === 'lower');
      const upperSeats = allSeats.filter((s) => s.deck === 'upper');
      this.lowerDeck = this.groupIntoRows(lowerSeats, seatsPerRow);
      this.upperDeck = this.groupIntoRows(upperSeats, seatsPerRow);
    } else {
      const rows = Math.ceil(totalSeats / seatsPerRow);
      const allSeats: Seat[] = [];

      for (let r = 1; r <= rows; r++) {
        for (let c = 0; c < seatsPerRow; c++) {
          const seat = this.createSeat(r, this.config.columns[c], 'single');
          this.applySeatStatus(seat, bookedMap);
          allSeats.push(seat);
        }
      }

      this.lowerDeck = this.groupIntoRows(allSeats, seatsPerRow);
    }
  }

  createSeat(
    row: number,
    col: string,
    deck: 'lower' | 'upper' | 'single',
  ): Seat {
    const prefix = deck === 'lower' ? 'L' : deck === 'upper' ? 'U' : '';
    const id = prefix ? `${prefix}-${row}${col}` : `${row}${col}`;
    return {
      id,
      row,
      column: col,
      deck,
      status: 'available',
      position: this.getPosition(col),
    };
  }

  getPosition(col: string): 'window' | 'aisle' | 'middle' {
    if (this.layout === 'bus-sleeper') {
      return col === 'A' || col === 'C' ? 'window' : 'aisle';
    } else if (this.layout === 'bus-seater') {
      return col === 'A' || col === 'D' ? 'window' : 'aisle';
    } else {
      if (col === 'A' || col === 'F') return 'window';
      if (col === 'C' || col === 'D') return 'aisle';
      return 'middle';
    }
  }

  applySeatStatus(seat: Seat, bookedMap: Map<string, string>): void {
    if (bookedMap.has(seat.id)) {
      const gender = bookedMap.get(seat.id);
      seat.status =
        this.mode === 'bus' && gender === 'female' ? 'taken-female' : 'taken';
    }
  }

  groupIntoRows(seats: Seat[], perRow: number): Seat[][] {
    const rows: Seat[][] = [];
    for (let i = 0; i < seats.length; i += perRow) {
      rows.push(seats.slice(i, i + perRow));
    }
    return rows;
  }

  isAisleAfter(colIndex: number): boolean {
    return colIndex === this.config.aisleAfter;
  }

  // Handle seat click — supports multiple selection
  selectSeat(seat: Seat): void {
    if (seat.status === 'taken' || seat.status === 'taken-female') return;

    // If already selected, deselect it
    if (seat.status === 'selected') {
      seat.status = 'available';
      this.selectedSeats = this.selectedSeats.filter((id) => id !== seat.id);
      return;
    }

    // If max seats already selected, don't allow more
    if (this.allSeatsSelected) return;

    // Select the seat
    seat.status = 'selected';
    this.selectedSeats.push(seat.id);
  }

  onConfirmSeat(): void {
    console.log('selectedSeats:', this.selectedSeats);
    console.log('maxSeats:', this.maxSeats);
    console.log('length === max:', this.selectedSeats.length === this.maxSeats);

    if (this.selectedSeats.length === this.maxSeats) {
      //this was blocking confirmseat button because was set to false (number compared to string)
      this.transportService.selectedSeat.set(this.selectedSeats[0]);
      this.seatConfirmed.emit(this.selectedSeats);
      console.log('Emitted!');
    }
  }
}
