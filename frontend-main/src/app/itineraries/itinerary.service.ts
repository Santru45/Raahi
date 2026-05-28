import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, switchMap, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Itinerary } from './itinerary.model';
import { env } from '../../../.environment';

@Injectable({ providedIn: 'root' })
export class ItineraryService {
  private http = inject(HttpClient);
  private readonly BASE_URL = env.baseUrl;

  // ─── Itineraries ─────────────────────────────────────────────────────────────

  getItineraries(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE_URL}/itineraries`);
  }

  createItinerary(formValue: any, userId: string): Observable<any> {
    const newTrip = {
      user_id: userId,
      trip_name: formValue.trip_name,
      destination: formValue.destination || null,
      start_date: null,
      end_date: null,
      type: 'custom',
      image_url: formValue.image_url || null,
      images: formValue.image_url
        ? [formValue.image_url]
        : [
            'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
          ],
      created_at: new Date().toISOString(),
    };
    return this.http.post<any>(`${this.BASE_URL}/itineraries`, newTrip);
  }

  updateItineraryDates(tripId: string, items: any[]): Observable<any> {
    const dates = items
      .map((i) => i.date)
      .filter((d) => !!d)
      .sort();
    if (dates.length === 0) {
      return this.http.patch(`${this.BASE_URL}/itineraries/${tripId}`, {
        start_date: null,
        end_date: null,
      });
    }
    return this.http.patch(`${this.BASE_URL}/itineraries/${tripId}`, {
      start_date: dates[0],
      end_date: dates[dates.length - 1],
    });
  }

  patchTrip(
    id: string,
    fields: {
      trip_name?: string;
      destination?: string | null;
      image_url?: string;
    },
  ): Observable<any> {
    return this.http.patch(`${this.BASE_URL}/itineraries/${id}`, fields);
  }

  deleteItinerary(id: string): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/itineraries/${id}`);
  }

  // ─── Itinerary Items ──────────────────────────────────────────────────────────

  getItemsForTrip(
    tripId: string,
    tripType: string = 'custom',
  ): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE_URL}/itinerary-items`).pipe(
      map((items) => {
        const filtered = items.filter(
          (item) => String(item.itinerary_id) === String(tripId),
        );
        if (tripType === 'std') {
          return filtered.sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
          );
        }
        return filtered.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
      }),
    );
  }

  addItem(tripId: string, formValue: any): Observable<any> {
    const newItem = { ...formValue, itinerary_id: tripId };
    return this.http.post<any>(`${this.BASE_URL}/itinerary-items`, newItem);
  }

  deleteItem(itemId: string): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/itinerary-items/${itemId}`);
  }

  // Delete all itinerary items that reference a specific booking
  deleteSyncedItemsByBookingRef(bookingRef: string): Observable<any> {
    return this.http.get<any[]>(`${this.BASE_URL}/itinerary-items`).pipe(
      switchMap((items) => {
        const itemsToDelete = items.filter(
          (i) => i.source_booking_ref === bookingRef,
        );
        if (itemsToDelete.length === 0) {
          return of({ deleted: 0 });
        }
        return forkJoin(
          itemsToDelete.map((item) =>
            this.http.delete(`${this.BASE_URL}/itinerary-items/${item._id}`),
          ),
        ).pipe(map(() => ({ deleted: itemsToDelete.length })));
      }),
    );
  }

  // ─── Calendar Export ──────────────────────────────────────────────────────────

  exportToCalendar(items: any[], tripName: string): void {
    if (!items || items.length === 0) {
      console.warn('No plans to export!');
      return;
    }

    const escapeIcs = (str: string) =>
      (str || '').replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');

    let fileContent =
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'CALSCALE:GREGORIAN',
        'PRODID:-//TravelEase//TravelJournal//EN',
      ].join('\r\n') + '\r\n';

    items.forEach((item) => {
      const dateStr = String(item.date || '').replace(/-/g, '');
      const d = new Date(item.date || new Date());
      d.setDate(d.getDate() + 1);
      const endDateStr = d.toISOString().split('T')[0].replace(/-/g, '');
      const uid = `${item._id || item.id}@travelease`;

      fileContent +=
        [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTART;VALUE=DATE:${dateStr}`,
          `DTEND;VALUE=DATE:${endDateStr}`,
          `SUMMARY:${escapeIcs(item.title)}`,
          `LOCATION:${escapeIcs(item.location)}`,
          `DESCRIPTION:${escapeIcs(item.notes || 'Part of trip: ' + tripName)}`,
          'STATUS:CONFIRMED',
          'END:VEVENT',
        ].join('\r\n') + '\r\n';
    });

    fileContent += 'END:VCALENDAR';

    const blob = new Blob([fileContent], {
      type: 'text/calendar;charset=utf-8',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(tripName || 'trip').replace(/\s+/g, '_')}_itinerary.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setTimeout(() => {
      window.open(
        'https://calendar.google.com/calendar/r/settings/export',
        '_blank',
      );
    }, 500);
  }

  // ─── Auto Sync ────────────────────────────────────────────────────────────────

  syncBookingsToTrip(trip: any, userId: string): Observable<boolean> {
    if (trip?.type !== 'custom' || trip?.user_id !== userId) return of(false);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isValidDate = (dateStr: string): boolean => {
      const d = new Date(dateStr.split('T')[0]);
      return d >= today;
    };

    return forkJoin({
      existingItems: this.http.get<any[]>(`${this.BASE_URL}/itinerary-items`),
      travelBookings: this.http.get<any[]>(
        `${this.BASE_URL}/bookings/travel/user/${userId}`,
      ),
      hotelBookings: this.http.get<any[]>(
        `${this.BASE_URL}/bookings/hotel/user/${userId}`,
      ),
    }).pipe(
      switchMap(({ existingItems, travelBookings, hotelBookings }) => {
        const syncedRefs = new Set(
          existingItems
            .filter((i) => i.source_booking_ref)
            .map((i) => i.source_booking_ref),
        );

        // Filter out cancelled bookings
        const activeTravel = travelBookings.filter(
          (b) =>
            b.bookingStatus !== 'cancelled' && b.paymentStatus !== 'cancelled',
        );
        const activeHotel = hotelBookings.filter(
          (b) =>
            b.bookingStatus !== 'cancelled' && b.paymentStatus !== 'cancelled',
        );

        // Find cancelled synced items to remove
        const activeRefs = new Set([
          ...activeTravel.map((b) => b.bookingReference),
          ...activeHotel.map((b) => b.bookingReference),
        ]);
        const itemsToRemove = existingItems.filter(
          (i) => i.source_booking_ref && !activeRefs.has(i.source_booking_ref),
        );

        const itemsToSync: any[] = [];

        activeTravel.forEach((booking) => {
          if (syncedRefs.has(booking.bookingReference)) return;
          const snap = booking.serviceSnapshot;
          const bookingDate = snap.departureTime.split('T')[0];
          if (!isValidDate(bookingDate)) return;
          itemsToSync.push({
            itinerary_id: trip._id ?? trip.id,
            category: 'travel',
            title: `${snap.operatorName} ${snap.serviceNumber} — ${snap.from} to ${snap.to}`,
            location: snap.from,
            date: bookingDate,
            notes: `Cabin: ${snap.cabinClass}. Ref: ${booking.bookingReference}`,
            status: 'confirmed',
            source_booking_ref: booking.bookingReference,
          });
        });

        activeHotel.forEach((booking) => {
          if (syncedRefs.has(booking.bookingReference)) return;
          const checkInDate = (booking.checkIn ?? '').split('T')[0];
          if (!checkInDate || !isValidDate(checkInDate)) return;
          itemsToSync.push({
            itinerary_id: trip._id ?? trip.id,
            category: 'hotel',
            title: `Hotel Check-in — ${booking.roomType ?? booking.hotelName ?? 'Room'}`,
            location: booking.hotelName ?? booking.hotelId,
            date: checkInDate,
            notes: `${booking.numNights} nights. Ref: ${booking.bookingReference}`,
            status: 'confirmed',
            source_booking_ref: booking.bookingReference,
          });
        });

        // Remove cancelled synced items first
        if (itemsToRemove.length > 0) {
          return forkJoin(
            itemsToRemove.map((item) =>
              this.http.delete(`${this.BASE_URL}/itinerary-items/${item._id}`),
            ),
          ).pipe(
            switchMap(() => {
              if (itemsToSync.length === 0) return of(true);
              return this.addItemsSequentially(itemsToSync);
            }),
          );
        }

        if (itemsToSync.length === 0) return of(false);

        return this.addItemsSequentially(itemsToSync);
      }),
    );
  }

  private addItemsSequentially(items: any[]): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      const postNext = (index: number) => {
        if (index >= items.length) {
          observer.next(true);
          observer.complete();
          return;
        }
        this.http
          .post(`${this.BASE_URL}/itinerary-items`, items[index])
          .subscribe({
            next: () => postNext(index + 1),
            error: () => postNext(index + 1),
          });
      };
      postNext(0);
    });
  }

  getTravelBookingsByUser(userId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.BASE_URL}/bookings/travel/user/${userId}`,
    );
  }

  getHotelBookingsByUser(userId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.BASE_URL}/bookings/hotel/user/${userId}`,
    );
  }
}
