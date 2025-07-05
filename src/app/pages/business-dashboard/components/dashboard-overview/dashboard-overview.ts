import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Reservation } from '../../../../services/reservation';
import { IReservation } from '../../../../models/ireservation';
import { AuthService } from '../../../../services/auth';

interface DayReservations {
  date: Date;
  dayName: string;
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

  // 📅 Prenotazioni del giorno selezionato
  selectedDayReservations: IReservation[] = [];
  selectedDay: DayReservations | null = null;

  // 📅 Prossimi 7 giorni
  next7Days: DayReservations[] = [];

  // 📅 Navigazione calendario
  currentWeekStart: Date = new Date();
  weekOffset: number = 0; // 0 = settimana corrente, -1 = precedente, +1 = successiva

  // 🏪 ID del ristorante dell'utente loggato - DINAMICO
  currentRestaurantId: number = 0;

  // 🔄 Loading states
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private reservationService: Reservation,
    private authService: AuthService,
    private cdr: ChangeDetectorRef  // ← AGGIUNGI QUESTO
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

    // 🔥 USA IL BUSINESS ID DELL'UTENTE LOGGATO
    const businessId = currentUser.userId;
    console.log('👤 Business ID dell\'utente loggato:', businessId);

    // Carica ristorante per business ID
    this.reservationService.getRestaurantByBusinessId(businessId).subscribe({
      next: (restaurant: any) => {
        this.currentRestaurantId = restaurant.id; // ← DINAMICO!
        console.log('🏪 Restaurant ID ottenuto dinamicamente:', this.currentRestaurantId);
        console.log('🏪 Ristorante:', restaurant.name);

        // Ora carica i dati della dashboard
        this.loadDashboardData();
      },
      error: (error) => {
        this.error = 'Errore: ristorante non trovato per questo utente business';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('❌ Errore caricamento ristorante per business ID', businessId, ':', error);
      }
    });
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
  }

  // 📅 Carica prenotazioni di oggi
  private loadTodayReservations(): void {
    this.reservationService.getTodayReservations(this.currentRestaurantId).subscribe({
      next: (reservations: IReservation[]) => {
        this.todayReservationsList = reservations;
        this.todayReservations = reservations.length;

        // Imposta oggi come giorno selezionato di default
        this.selectedDayReservations = reservations;

        // 📅 Genera calendario dopo aver caricato i dati di oggi
        this.generateNext7Days();

        this.loading = false;

        // 🔥 FORZA CHANGE DETECTION
        this.cdr.detectChanges();

        console.log('✅ Prenotazioni di oggi caricate:', reservations.length);
      },
      error: (error) => {
        this.error = 'Errore nel caricamento delle prenotazioni di oggi';
        this.loading = false;

        // 🔥 FORZA CHANGE DETECTION ANCHE IN CASO DI ERRORE
        this.cdr.detectChanges();

        console.error('❌ Errore prenotazioni oggi:', error);
      }
    });
  }

  // 📊 Carica statistiche prenotazioni
  private loadReservationStats(): void {
    this.reservationService.getReservationStats(this.currentRestaurantId).subscribe({
      next: (stats) => {
        this.monthReservations = stats.totalReservations;

        // 🔥 FORZA CHANGE DETECTION
        this.cdr.detectChanges();

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

  // 📅 Genera calendario per la settimana corrente
  private generateNext7Days(): void {
    this.next7Days = [];
    const today = new Date();

    // Calcola l'inizio della settimana basandosi sull'offset
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + (this.weekOffset * 7));

    this.currentWeekStart = weekStart;

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);

      const dayReservations: DayReservations = {
        date: date,
        dayName: this.getDayName(date, today),
        isToday: this.isSameDay(date, today),
        isTomorrow: this.isSameDay(date, new Date(today.getTime() + 24 * 60 * 60 * 1000))
      };

      this.next7Days.push(dayReservations);
    }

    // Se non c'è un giorno selezionato o non è nella settimana corrente, seleziona il primo
    if (!this.selectedDay || !this.isDateInCurrentWeek(this.selectedDay.date)) {
      this.selectedDay = this.next7Days[0];
      this.loadReservationsForDay(this.selectedDay);
    }
  }

  // 📅 Naviga alla settimana precedente
  previousWeek(): void {
    this.weekOffset--;
    this.generateNext7Days();

    // 🔥 FORZA CHANGE DETECTION
    this.cdr.detectChanges();

    console.log('📅 Settimana precedente:', this.getCurrentPeriodText());
  }

  // 📅 Naviga alla settimana successiva
  nextWeek(): void {
    this.weekOffset++;
    this.generateNext7Days();

    // 🔥 FORZA CHANGE DETECTION
    this.cdr.detectChanges();

    console.log('📅 Settimana successiva:', this.getCurrentPeriodText());
  }

  // 📅 Torna alla settimana corrente
  goToCurrentWeek(): void {
    this.weekOffset = 0;
    this.generateNext7Days();
  }

  // 📅 Testo del periodo corrente
  getCurrentPeriodText(): string {
    if (this.weekOffset === 0) {
      return 'Questa Settimana';
    } else if (this.weekOffset === -1) {
      return 'Settimana Scorsa';
    } else if (this.weekOffset === 1) {
      return 'Prossima Settimana';
    } else if (this.weekOffset < 0) {
      return `${Math.abs(this.weekOffset)} settimane fa`;
    } else {
      return `Tra ${this.weekOffset} settimane`;
    }
  }

  // 📅 Nome del giorno aggiornato
  private getDayName(date: Date, today: Date): string {
    if (this.isSameDay(date, today)) return 'Oggi';

    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    if (this.isSameDay(date, tomorrow)) return 'Domani';

    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    if (this.isSameDay(date, yesterday)) return 'Ieri';

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    return dayNames[date.getDay()];
  }

  // 📅 Verifica se due date sono lo stesso giorno
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  // 📅 Verifica se una data è nel passato
  isPastDay(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  }

  // 📅 Verifica se una data è nella settimana corrente visualizzata
  private isDateInCurrentWeek(date: Date): boolean {
    return this.next7Days.some(day => this.isSameDay(day.date, date));
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

  // 📅 Seleziona un giorno del calendario
  selectDay(day: DayReservations): void {
    this.selectedDay = day;
    this.loadReservationsForDay(day);
    console.log('📅 Giorno selezionato:', day.dayName, day.date.toDateString());
  }

  // 📅 Carica prenotazioni per un giorno specifico
  private loadReservationsForDay(day: DayReservations): void {
    const today = new Date();

    if (this.isSameDay(day.date, today)) {
      // Se è oggi, usa i dati già caricati
      this.selectedDayReservations = this.todayReservationsList;

      // 🔥 FORZA CHANGE DETECTION
      this.cdr.detectChanges();

      console.log(`📅 Prenotazioni per ${day.dayName}: ${this.selectedDayReservations.length} (cache)`);
    } else {
      // Per altri giorni, fai chiamata API
      const dateString = day.date.toISOString().split('T')[0]; // YYYY-MM-DD

      this.reservationService.getReservationsByDate(this.currentRestaurantId, dateString).subscribe({
        next: (reservations: IReservation[]) => {
          this.selectedDayReservations = reservations;

          // 🔥 FORZA CHANGE DETECTION
          this.cdr.detectChanges();

          console.log(`📅 Prenotazioni per ${day.dayName}: ${reservations.length}`);
        },
        error: (error) => {
          console.error(`❌ Errore prenotazioni per ${day.dayName}:`, error);
          this.selectedDayReservations = [];

          // 🔥 FORZA CHANGE DETECTION ANCHE IN CASO DI ERRORE
          this.cdr.detectChanges();
        }
      });
    }
  }

  // 📋 Titolo dinamico aggiornato
  getSelectedDayTitle(): string {
    if (!this.selectedDay) return 'Oggi';

    const today = new Date();
    if (this.isSameDay(this.selectedDay.date, today)) return 'Oggi';

    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    if (this.isSameDay(this.selectedDay.date, tomorrow)) return 'Domani';

    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    if (this.isSameDay(this.selectedDay.date, yesterday)) return 'Ieri';

    return this.selectedDay.dayName + ' ' +
           this.selectedDay.date.getDate() + '/' +
           (this.selectedDay.date.getMonth() + 1);
  }

  // 📋 Sottotitolo con data completa
  getSelectedDaySubtitle(): string {
    if (!this.selectedDay) return '';

    const date = this.selectedDay.date;
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return date.toLocaleDateString('it-IT', options);
  }

  // 📊 Calcola trend mese (TODO: implementare logica reale)
  private calculateMonthTrend(): void {
    // TODO: Implementare confronto con mese precedente
    // Per ora impostiamo a 0
    this.monthTrend = 0;
  }
}
