import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment.development';

// Import dei models separati
import { IReservation } from '../models/ireservation';
import { IReservationStats } from '../models/ireservation-stats';

// Interface per la creazione prenotazione
export interface CreateReservationRequest {
  restaurantId: number;
  customerId: number;
  reservationDate: string; // formato YYYY-MM-DD
  reservationTime: string; // formato HH:MM
  numberOfPeople: number;
  customerName: string;
  customerPhone?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {

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

  // 👤 Prenotazioni di un cliente
  getReservationsByCustomer(customerId: number): Observable<IReservation[]> {
    return this.http.get<IReservation[]>(`${this.API_URL}/customer/${customerId}`);
  }

  // 🔍 Prenotazione per ID
  getReservationById(id: number): Observable<IReservation> {
    return this.http.get<IReservation>(`${this.API_URL}/${id}`);
  }

  // ➕ Crea nuova prenotazione - AGGIORNATO
  createReservation(reservation: CreateReservationRequest): Observable<IReservation> {
    console.log('📤 Invio prenotazione:', reservation);
    return this.http.post<IReservation>(this.API_URL, reservation);
  }

  // 🔄 Aggiorna prenotazione
  updateReservation(id: number, reservation: Partial<CreateReservationRequest>): Observable<IReservation> {
    return this.http.put<IReservation>(`${this.API_URL}/${id}`, reservation);
  }

  // 🗑️ Cancella prenotazione
  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  // 📊 Statistiche prenotazioni ristorante
  getReservationStats(restaurantId: number): Observable<IReservationStats> {
    return this.http.get<IReservationStats>(`${this.API_URL}/restaurant/${restaurantId}/stats`);
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

  // 🔧 Utility per convertire Date in stringa formato backend - CORRETTO
  formatDateForBackend(date: Date): string {
    // Usa il timezone locale invece di UTC per evitare shift di giorno
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 🔧 Utility per convertire ora in formato backend
  formatTimeForBackend(time: string): string {
    return time.length === 5 ? time : time.substring(0, 5); // Assicura HH:MM
  }

  // 📊 Conta prenotazioni per status (tutte sono confermate)
  countByStatus(reservations: IReservation[], status: string): number {
    return reservations.length; // Tutte confermate
  }

  // 🔧 Crea oggetto prenotazione da BookingData - AGGIORNATO
  createReservationFromBookingData(
    bookingData: any,
    restaurantId: number,
    customerId: number,
    customerName: string,
    customerPhone: string, // ← ORA OBBLIGATORIO
    notes?: string
  ): CreateReservationRequest {

    // Validazione telefono obbligatorio
    if (!customerPhone || customerPhone.trim() === '') {
      throw new Error('Il numero di telefono è obbligatorio per la prenotazione');
    }

    return {
      restaurantId,
      customerId,
      reservationDate: this.formatDateForBackend(bookingData.date),
      reservationTime: this.formatTimeForBackend(bookingData.time),
      numberOfPeople: bookingData.people,
      customerName,
      customerPhone: customerPhone.trim(),
      notes: notes?.trim() || undefined
    };
  }

  // 🔧 Validazione dati prenotazione - AGGIORNATA
  validateReservationData(data: any): { isValid: boolean; error?: string } {
    if (!data.restaurantId) {
      return { isValid: false, error: 'ID ristorante mancante' };
    }
    if (!data.customerId) {
      return { isValid: false, error: 'ID cliente mancante' };
    }
    if (!data.reservationDate) {
      return { isValid: false, error: 'Data prenotazione mancante' };
    }
    if (!data.reservationTime) {
      return { isValid: false, error: 'Orario prenotazione mancante' };
    }
    if (!data.numberOfPeople || data.numberOfPeople < 1) {
      return { isValid: false, error: 'Numero persone non valido' };
    }
    if (!data.customerName || data.customerName.trim() === '') {
      return { isValid: false, error: 'Nome cliente mancante' };
    }
    if (!data.customerPhone || data.customerPhone.trim() === '') {
      return { isValid: false, error: 'Numero di telefono obbligatorio' };
    }

    return { isValid: true };
  }
}
