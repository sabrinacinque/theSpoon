import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment.development';

// Import dei models separati
import { IReservation } from '../models/ireservation';
import { IReservationStats } from '../models/ireservation-stats';

@Injectable({
  providedIn: 'root'
})
export class Reservation {

  private readonly API_URL = `${environment.apiUrl}/reservations`;

  constructor(private http: HttpClient) {}

  // 📅 Prenotazioni di oggi per un ristorante
  getTodayReservations(restaurantId: number): Observable<IReservation[]> {
    return this.http.get<IReservation[]>(`${this.API_URL}/restaurant/${restaurantId}/today`);
  }

  // 📋 Tutte le prenotazioni di un ristorante
  getReservationsByRestaurant(restaurantId: number): Observable<IReservation[]> {
    return this.http.get<IReservation[]>(`${this.API_URL}/restaurant/${restaurantId}`);
  }

  // 📅 Prenotazioni per una data specifica
  getReservationsByDate(restaurantId: number, date: string): Observable<IReservation[]> {
    return this.http.get<IReservation[]>(`${this.API_URL}/restaurant/${restaurantId}/date/${date}`);
  }

  // 📊 Statistiche prenotazioni ristorante
  getReservationStats(restaurantId: number): Observable<IReservationStats> {
    return this.http.get<IReservationStats>(`${this.API_URL}/restaurant/${restaurantId}/stats`);
  }

  // ➕ Crea nuova prenotazione
  createReservation(reservation: any): Observable<IReservation> {
    return this.http.post<IReservation>(this.API_URL, reservation);
  }

  // 🔄 Aggiorna prenotazione
  updateReservation(id: number, reservation: any): Observable<IReservation> {
    return this.http.put<IReservation>(`${this.API_URL}/${id}`, reservation);
  }

  // 🗑️ Cancella prenotazione
  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  // 📱 Formatta orario per visualizzazione
  formatTime(time: string): string {
    return time.substring(0, 5); // "19:30:00" -> "19:30"
  }

  // 📅 Formatta data per visualizzazione
  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // 📊 Conta prenotazioni per status (da implementare quando aggiungiamo status)
  countByStatus(reservations: IReservation[], status: string): number {
    // Per ora tutte le prenotazioni sono "confirmed"
    return reservations.length;
  }
  getRestaurantByBusinessId(businessId: number): Observable<any> {
  return this.http.get<any>(`${environment.apiUrl}/restaurants/business/${businessId}`);
}
}
