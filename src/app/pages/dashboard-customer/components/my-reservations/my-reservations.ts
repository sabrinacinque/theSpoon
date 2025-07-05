// my-reservations.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IReservation } from '../../../../models/ireservation';
import { IUser } from '../../../../models/iuser';
import { ReservationService } from '../../../../services/reservation';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-reservations.html',
  styleUrls: ['./my-reservations.css']
})
export class MyReservations implements OnInit, OnChanges {
  @Input() reservations: IReservation[] = [];
  @Input() currentUser: IUser | null = null;
  @Output() reservationUpdated = new EventEmitter<void>();

  // Filtri
  selectedFilter: 'future' | 'past' | 'all' = 'future'; // Default: future
  filteredReservations: IReservation[] = [];
  
  // Categorie
  upcomingReservations: IReservation[] = [];
  pastReservations: IReservation[] = [];
  
  // Stati
  loading: boolean = false;
  showAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'info' | 'warning' | 'danger' = 'success';

  constructor(
    private reservationService: ReservationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔍 MyReservations - Prenotazioni ricevute:', this.reservations);
    this.categorizeReservations();
    this.applyFilter();
  }

  ngOnChanges(): void {
    console.log('🔄 MyReservations - OnChanges, prenotazioni aggiornate:', this.reservations);
    this.categorizeReservations();
    this.applyFilter();
  }

  private categorizeReservations(): void {
    const now = new Date();
    
    // Filtra prenotazioni future
    this.upcomingReservations = this.reservations
      .filter(reservation => this.isReservationFuture(reservation, now))
      .sort((a, b) => {
        const dateA = new Date(a.reservationDate + ' ' + a.reservationTime);
        const dateB = new Date(b.reservationDate + ' ' + b.reservationTime);
        return dateA.getTime() - dateB.getTime();
      });

    // Filtra prenotazioni passate
    this.pastReservations = this.reservations
      .filter(reservation => !this.isReservationFuture(reservation, now))
      .sort((a, b) => {
        const dateA = new Date(a.reservationDate + ' ' + a.reservationTime);
        const dateB = new Date(b.reservationDate + ' ' + b.reservationTime);
        return dateB.getTime() - dateA.getTime(); // Più recenti prima
      });

    console.log('✅ Prenotazioni categorizzate:', {
      totali: this.reservations.length,
      future: this.upcomingReservations.length,
      passate: this.pastReservations.length
    });

    // Force change detection
    this.cdr.detectChanges();
  }

  // 🔥 LOGICA CORRETTA: Considera data E ora
  private isReservationFuture(reservation: IReservation, now: Date): boolean {
    try {
      const reservationDateTime = new Date(reservation.reservationDate + ' ' + reservation.reservationTime);
      const result = reservationDateTime > now;
      
      console.log(`📅 Controllo prenotazione ${reservation.id}:`, {
        data: reservation.reservationDate,
        ora: reservation.reservationTime,
        dateTime: reservationDateTime,
        now: now,
        isFuture: result
      });
      
      return result;
    } catch (error) {
      console.error('❌ Errore nel controllo data prenotazione:', error, reservation);
      return false;
    }
  }

  // Filtri
  onFilterChange(filter: 'future' | 'past' | 'all'): void {
    console.log('🔍 Cambio filtro da', this.selectedFilter, 'a', filter);
    this.selectedFilter = filter;
    this.applyFilter();
  }

  private applyFilter(): void {
    switch (this.selectedFilter) {
      case 'future':
        this.filteredReservations = [...this.upcomingReservations];
        break;
      case 'past':
        this.filteredReservations = [...this.pastReservations];
        break;
      case 'all':
        this.filteredReservations = [...this.upcomingReservations, ...this.pastReservations];
        break;
    }
    
    console.log('✅ Filtro applicato:', {
      filtro: this.selectedFilter,
      risultati: this.filteredReservations.length,
      future: this.upcomingReservations.length,
      passate: this.pastReservations.length
    });
    
    this.cdr.detectChanges();
  }

  // Test method per debug
  testClick(action: string, reservationId: number): void {
    console.log('🖱️ CLICK TEST:', action, 'per prenotazione', reservationId);
    
    if (action === 'edit') {
      this.editReservation(this.findReservationById(reservationId));
    } else if (action === 'delete') {
      this.cancelReservation(this.findReservationById(reservationId));
    }
  }

  private findReservationById(id: number): IReservation {
    return this.reservations.find(r => r.id === id) || this.reservations[0];
  }

  // Modifica prenotazione
  editReservation(reservation: IReservation): void {
    if (!reservation) {
      console.error('❌ Prenotazione non trovata per modifica');
      return;
    }

    console.log('✏️ Tentativo modifica prenotazione:', reservation.id);

    if (!this.isReservationFuture(reservation, new Date())) {
      this.showAlertMessage('Non puoi modificare una prenotazione passata', 'warning');
      return;
    }

    this.loading = true;
    console.log('✏️ Inizio modifica prenotazione:', reservation.id);
    
    // Simulazione chiamata API
    setTimeout(() => {
      this.loading = false;
      this.showAlertMessage('Le tue modifiche sono state inviate al ristorante', 'success');
      console.log('✅ Modifica completata per prenotazione:', reservation.id);
      this.reservationUpdated.emit();
    }, 1500);
  }

  // Cancella prenotazione
  cancelReservation(reservation: IReservation): void {
    if (!reservation) {
      console.error('❌ Prenotazione non trovata per cancellazione');
      return;
    }

    const isFuture = this.isReservationFuture(reservation, new Date());
    console.log('🗑️ Tentativo cancellazione prenotazione:', reservation.id, 'isFuture:', isFuture);
    
    const confirmMessage = isFuture 
      ? 'Sei sicuro di voler cancellare questa prenotazione? Il ristorante riceverà la notifica.'
      : 'Questa prenotazione è già passata. Vuoi comunque procedere?';
    
    if (!confirm(confirmMessage)) {
      console.log('❌ Cancellazione annullata dall\'utente');
      return;
    }

    this.loading = true;
    console.log('🗑️ Inizio cancellazione prenotazione:', reservation.id);
    
    // Simulazione chiamata API
    setTimeout(() => {
      this.loading = false;
      
      if (isFuture) {
        this.showAlertMessage('Il ristorante ha ricevuto la tua cancellazione', 'info');
      } else {
        this.showAlertMessage('Cancellazione avvenuta con successo', 'success');
      }
      
      console.log('✅ Cancellazione completata per prenotazione:', reservation.id);
      this.reservationUpdated.emit();
    }, 1500);
  }

  // Alert system
  private showAlertMessage(message: string, type: 'success' | 'info' | 'warning' | 'danger'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    console.log('🚨 Alert mostrato:', type, message);
    this.cdr.detectChanges();

    // Nascondi alert dopo 4 secondi
    setTimeout(() => {
      this.hideAlert();
    }, 4000);
  }

  hideAlert(): void {
    this.showAlert = false;
    console.log('❌ Alert nascosto');
    this.cdr.detectChanges();
  }

  // Utility methods
  formatDate(date: string): string {
    try {
      return new Date(date).toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('❌ Errore nel formato data:', error, date);
      return date;
    }
  }

  formatTime(time: string): string {
    try {
      return time.slice(0, 5); // Rimuove i secondi
    } catch (error) {
      console.error('❌ Errore nel formato ora:', error, time);
      return time;
    }
  }

  getStatusIcon(reservation: IReservation): string {
    try {
      const isFuture = this.isReservationFuture(reservation, new Date());
      return isFuture ? 'fas fa-clock text-warning' : 'fas fa-check-circle text-success';
    } catch (error) {
      console.error('❌ Errore nel calcolo icona status:', error, reservation);
      return 'fas fa-question-circle text-muted';
    }
  }

  getStatusText(reservation: IReservation): string {
    try {
      const isFuture = this.isReservationFuture(reservation, new Date());
      return isFuture ? 'Prossima' : 'Completata';
    } catch (error) {
      console.error('❌ Errore nel calcolo testo status:', error, reservation);
      return 'Sconosciuto';
    }
  }

  // TrackBy per performance
  trackByReservation(index: number, reservation: IReservation): number {
    return reservation.id;
  }

  // Getter per template
  get filterCounts() {
    return {
      future: this.upcomingReservations.length,
      past: this.pastReservations.length,
      all: this.reservations.length
    };
  }

  get hasFilteredReservations(): boolean {
    return this.filteredReservations.length > 0;
  }

  // Debug method
  debugReservation(reservation: IReservation): void {
    console.log('🔍 DEBUG Prenotazione:', {
      id: reservation.id,
      data: reservation.reservationDate,
      ora: reservation.reservationTime,
      persone: reservation.numberOfPeople,
      cliente: reservation.customerName,
      telefono: reservation.customerPhone,
      note: reservation.notes,
      status: this.getStatusText(reservation),
      isFuture: this.isReservationFuture(reservation, new Date())
    });
  }
}