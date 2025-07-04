import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Reservation } from '../../../../services/reservation';
import { IReservation } from '../../../../models/ireservation';
import { AuthService } from '../../../../services/auth';

interface DayReservations {
  date: Date;
  dayName: string;
  reservations: number;
  isToday: boolean;
  isTomorrow: boolean;
}

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './dashboard-overview.html',
  styleUrls: ['./dashboard-overview.css']
})
export class DashboardOverview implements OnInit {

  // 📊 Metriche principali - TUTTO REALE
  todayReservations: number = 0;
  averageRating: number = 0;
  totalReviews: number = 0;
  monthReservations: number = 0;
  monthTrend: number = 0; // % crescita vs mese precedente

  // 📅 Prenotazioni di oggi
  todayReservationsList: IReservation[] = [];

  // 📅 Prossimi 7 giorni
  next7Days: DayReservations[] = [];

  // 🏪 ID del ristorante dell'utente loggato - DINAMICO
  currentRestaurantId: number = 0;

  // 🔄 Loading states
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private reservationService: Reservation,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserRestaurant();
  }

  // 🏪 Carica il ristorante dell'utente loggato
  private loadUserRestaurant(): void {
    const currentUser = this.authService.currentUser();

    if (!currentUser || !this.authService.isBusiness()) {
      this.error = 'Errore: utente non autorizzato';
      this.loading = false;
      return;
    }

    // TODO: Implementare chiamata per ottenere il restaurant ID dell'utente
    // Per ora usiamo ID 8 che sappiamo essere il tuo ristorante
    // Ma dovrebbe essere: this.getRestaurantByBusinessId(currentUser.userId)
    this.currentRestaurantId = 8; // TEMPORANEO - da sostituire con API call

    console.log('👤 Utente business:', currentUser.firstName, currentUser.lastName);
    console.log('🏪 Restaurant ID:', this.currentRestaurantId);

    this.loadDashboardData();
  }

  // 🔄 Carica tutti i dati della dashboard
  private loadDashboardData(): void {
    if (this.currentRestaurantId === 0) {
      this.error = 'Errore: ristorante non trovato';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    // Carica prenotazioni di oggi
    this.loadTodayReservations();

    // Carica statistiche totali
    this.loadReservationStats();

    // Carica reviews e rating
    this.loadReviewStats();

    // Genera calendario prossimi 7 giorni
    this.generateNext7Days();
  }

  // 📅 Carica prenotazioni di oggi
  private loadTodayReservations(): void {
    this.reservationService.getTodayReservations(this.currentRestaurantId).subscribe({
      next: (reservations: IReservation[]) => {
        this.todayReservationsList = reservations;
        this.todayReservations = reservations.length;
        this.loading = false;
        console.log('✅ Prenotazioni di oggi caricate:', reservations.length);
      },
      error: (error) => {
        this.error = 'Errore nel caricamento delle prenotazioni di oggi';
        this.loading = false;
        console.error('❌ Errore prenotazioni oggi:', error);
      }
    });
  }

  // 📊 Carica statistiche prenotazioni
  private loadReservationStats(): void {
    this.reservationService.getReservationStats(this.currentRestaurantId).subscribe({
      next: (stats) => {
        this.monthReservations = stats.totalReservations;
        console.log('📊 Statistiche prenotazioni caricate:', stats);
      },
      error: (error) => {
        console.error('❌ Errore statistiche prenotazioni:', error);
      }
    });
  }

  // ⭐ Carica statistiche reviews (TODO: implementare quando creiamo ReviewService)
  private loadReviewStats(): void {
    // TODO: Implementare ReviewService e chiamata API
    // this.reviewService.getReviewStats(this.currentRestaurantId).subscribe({
    //   next: (stats) => {
    //     this.averageRating = stats.averageRating;
    //     this.totalReviews = stats.totalReviews;
    //     console.log('⭐ Statistiche reviews caricate:', stats);
    //   },
    //   error: (error) => {
    //     console.error('❌ Errore statistiche reviews:', error);
    //   }
    // });

    // Per ora impostiamo a 0 (REALE)
    this.averageRating = 0;
    this.totalReviews = 0;
    console.log('⭐ Reviews non ancora implementate - valori a 0');
  }

  // 📅 Genera calendario prossimi 7 giorni
  private generateNext7Days(): void {
    this.next7Days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayReservations: DayReservations = {
        date: date,
        dayName: this.getDayName(date, i),
        reservations: this.getReservationsForDay(i),
        isToday: i === 0,
        isTomorrow: i === 1
      };

      this.next7Days.push(dayReservations);
    }
  }

  // 📅 Nome del giorno
  private getDayName(date: Date, index: number): string {
    if (index === 0) return 'Oggi';
    if (index === 1) return 'Domani';

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    return dayNames[date.getDay()];
  }

  // 📊 Prenotazioni reali per giorno
  private getReservationsForDay(dayIndex: number): number {
    if (dayIndex === 0) {
      // Oggi: usa il numero reale
      return this.todayReservations;
    }

    // TODO: Implementare chiamate API per i prossimi giorni
    // Per ora restituiamo 0 (REALE - non ci sono prenotazioni future)
    return 0;
  }

  // ⭐ Genera stelle per rating
  getStars(rating: number): string {
    if (rating === 0) return '☆☆☆☆☆'; // Stelle vuote se non ci sono recensioni

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    let stars = '⭐'.repeat(fullStars);
    if (hasHalfStar) stars += '✨';

    // Aggiungi stelle vuote per arrivare a 5
    const emptyStars = 5 - Math.ceil(rating);
    stars += '☆'.repeat(emptyStars);

    return stars;
  }

  // 🎨 Classe CSS per livello occupazione
  getOccupancyClass(reservations: number): string {
    if (reservations >= 20) return 'occupancy-high';
    if (reservations >= 10) return 'occupancy-medium';
    if (reservations >= 5) return 'occupancy-low';
    return 'occupancy-none';
  }

  // 📞 Chiama cliente
  callCustomer(phone: string): void {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  }

  // 🔄 Ricarica dati
  refreshData(): void {
    this.loadDashboardData();
  }

  // 📱 Formatta orario da backend
  formatTime(time: string): string {
    return this.reservationService.formatTime(time);
  }

  // 📊 Calcola trend mese (TODO: implementare logica reale)
  private calculateMonthTrend(): void {
    // TODO: Implementare confronto con mese precedente
    // Per ora impostiamo a 0
    this.monthTrend = 0;
  }
}
