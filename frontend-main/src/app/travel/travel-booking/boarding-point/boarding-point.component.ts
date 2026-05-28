import { Component, inject, OnInit, output } from '@angular/core';
import { TransportService } from '../../travel.service';
import { TravelDAO } from '../../travel.dao';

interface BoardingPoint {
  name: string;
  time: string;
  landmark: string;
}
@Component({
  selector: 'app-boarding-point',
  standalone: true,
  imports: [],
  templateUrl: './boarding-point.component.html',
  styleUrl: './boarding-point.component.scss',
})
export class BoardingPointComponent implements OnInit {
  private transportService = inject(TransportService);
  private travelDao = inject(TravelDAO);

  pointsConfirmed = output<{ boarding: string; dropping: string }>();

  boardingPoints: BoardingPoint[] = [];
  droppingPoints: BoardingPoint[] = [];

  selectedBoarding: string | null = null;
  selectedDropping: string | null = null;

  isLoading = true;

  ngOnInit(): void {
    const trip = this.transportService.selectedTrip();
    console.log('Boarding Loaded . Trip : ', trip?._id);
    if (!trip) return;

    //Fetch boarding points for this service
    this.travelDao.getBoardingPoints(trip._id, 'boarding').subscribe({
      next: (results) => {
        console.log('Raw boarding response:', JSON.stringify(results));
        console.log('Results length:', results.length);
        this.boardingPoints = results;
        console.log('Boarding points set :', this.boardingPoints);
      },
      error: (err) => {
        console.log('Boarding error:', err);
        this.boardingPoints = [];
      },
    });

    this.travelDao.getBoardingPoints(trip._id, 'drop').subscribe({
      next: (results) => {
        console.log('Dropping response:', results);
        this.droppingPoints = results;
        this.isLoading = false;
        console.log('isLoading set to false');
      },
      error: (err) => {
        console.log('Dropping error:', err);
        this.droppingPoints = [];
        this.isLoading = false;
      },
    });
  }

  selectBoarding(point: BoardingPoint) {
    this.selectedBoarding = point.name;
    this.transportService.boardingPoint.set(point.name);
  }

  selectDropping(point: BoardingPoint) {
    this.selectedDropping = point.name;
    this.transportService.dropPoint.set(point.name);
  }

  get canConfirm(): boolean {
    return !!this.selectedBoarding && !!this.selectedDropping;
  }

  onConfirm(): void {
    if (this.canConfirm) {
      this.pointsConfirmed.emit({
        boarding: this.selectedBoarding!,
        dropping: this.selectedDropping!,
      });
    }
  }
}
