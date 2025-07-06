// my-reservations.ts - CON SWEETALERT2
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IReservation } from '../../../../models/ireservation';
import { IUser } from '../../../../models/iuser';
import { ReservationService } from '../../../../services/reservation';
import Swal from 'sweetalert2'; // 🍬 IMPORT SWEETALERT2

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-reservations.html',
  styleUrls: ['./my-reservations.css']
})
export class MyReservations implements OnInit, OnChanges {
  @Input() reservations: IReservation[] = [];
  @Input() currentUser: IUser | null = null;
  @Output() reservationUpdated = new EventEmitter<void>();

  // Filtri
  selectedFilter: 'future' | 'past' | 'all' = 'future';
  filteredReservations: IReservation[] = [];
  
  // Categorie
  upcomingReservations: IReservation[] = [];
  pastReservations: IReservation[] = [];
  
  // Stati
  loading: boolean = false;

  // Stati per modal personalizzati (solo edit e confirm)
  showEditModal: boolean = false;
  currentReservation: IReservation | null = null;

  // Dati per modifica completa
  editData = {
    numberOfPeople: 1,
    reservationDate: '',
    reservationTime: '',
    notes: ''
  };

  constructor(
    private reservationService: ReservationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.categorizeReservations();
    this.applyFilter();
  }

  ngOnChanges(): void {
    this.categorizeReservations();
    this.applyFilter();
  }

  private categorizeReservations(): void {
    const now = new Date();
    
    this.upcomingReservations = this.reservations
      .filter(reservation => this.isReservationFuture(reservation, now))
      .sort((a, b) => {
        const dateA = new Date(a.reservationDate + ' ' + a.reservationTime);
        const dateB = new Date(b.reservationDate + ' ' + b.reservationTime);
        return dateA.getTime() - dateB.getTime();
      });

    this.pastReservations = this.reservations
      .filter(reservation => !this.isReservationFuture(reservation, now))
      .sort((a, b) => {
        const dateA = new Date(a.reservationDate + ' ' + a.reservationTime);
        const dateB = new Date(b.reservationDate + ' ' + b.reservationTime);
        return dateB.getTime() - dateA.getTime();
      });

    this.cdr.detectChanges();
  }

  private isReservationFuture(reservation: IReservation, now: Date): boolean {
    try {
      const reservationDateTime = new Date(reservation.reservationDate + ' ' + reservation.reservationTime);
      return reservationDateTime > now;
    } catch (error) {
      console.error('❌ Errore nel controllo data prenotazione:', error);
      return false;
    }
  }

  // Filtri
  onFilterChange(filter: 'future' | 'past' | 'all'): void {
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
    this.cdr.detectChanges();
  }

  // ✏️ MODIFICA PRENOTAZIONE
  editReservation(reservation: IReservation): void {
    if (!reservation) {
      console.error('❌ Prenotazione non trovata per modifica');
      return;
    }

    if (!this.isReservationFuture(reservation, new Date())) {
      this.showErrorMessage('Non puoi modificare una prenotazione passata');
      return;
    }

    this.currentReservation = reservation;
    this.editData = {
      numberOfPeople: reservation.numberOfPeople,
      reservationDate: reservation.reservationDate,
      reservationTime: reservation.reservationTime.substring(0, 5),
      notes: reservation.notes || ''
    };
    
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  // 🗑️ CANCELLA PRENOTAZIONE - CON SWEETALERT2
  async cancelReservation(reservation: IReservation): Promise<void> {
    if (!reservation) {
      console.error('❌ Prenotazione non trovata per cancellazione');
      return;
    }

    const isFuture = this.isReservationFuture(reservation, new Date());
    
    // 🍬 SWEETALERT2 CONFIRM
    const result = await Swal.fire({
      title: 'Cancella Prenotazione',
      html: `
        <div style="text-align: left; margin: 1rem 0;">
          <p style="margin-bottom: 1rem;">${isFuture 
            ? 'Sei sicuro di voler cancellare questa prenotazione? Il ristorante riceverà la notifica.'
            : 'Questa prenotazione è già passata. Vuoi comunque procedere?'}</p>
          <div style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #dc3545;">
            <strong>Prenotazione #${reservation.id}</strong><br>
            <small>${reservation.customerName}</small>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fas fa-trash"></i> Cancella',
      cancelButtonText: '<i class="fas fa-times"></i> Annulla',
      reverseButtons: true,
      customClass: {
        container: 'swal-container',
        popup: 'swal-popup',
        title: 'swal-title',
        confirmButton: 'swal-confirm',
        cancelButton: 'swal-cancel'
      }
    });

    if (result.isConfirmed) {
      this.executeCancel(reservation.id);
    }
  }

  // 🔧 GESTIONE MODAL DI MODIFICA

  confirmEdit(): void {
    if (this.currentReservation && this.isValidEditData()) {
      this.executeEdit(this.currentReservation.id);
    }
    this.cancelEdit();
  }

  cancelEdit(): void {
    this.showEditModal = false;
    this.currentReservation = null;
    this.editData = {
      numberOfPeople: 1,
      reservationDate: '',
      reservationTime: '',
      notes: ''
    };
    this.cdr.detectChanges();
  }

  // 🍬 SWEETALERT2 SUCCESS MESSAGES
  private showSuccessMessage(type: 'edit' | 'delete'): void {
    if (type === 'edit') {
      Swal.fire({
        title: 'Modifica Completata!',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <div style="margin: 1rem 0; font-size: 3rem; color: #28a745;">
              <i class="fas fa-edit"></i>
              <i class="fas fa-arrow-right" style="margin: 0 0.5rem; color: #6c757d;"></i>
              <i class="fas fa-check"></i>
            </div>
            <p>Le tue modifiche sono state inviate correttamente al ristorante.</p>
            <small style="color: #6c757d;">Riceverai una conferma via email.</small>
          </div>
        `,
        icon: 'success',
        confirmButtonText: '<i class="fas fa-check"></i> Perfetto!',
        confirmButtonColor: '#28a745',
        timer: 4000,
        timerProgressBar: true,
        customClass: {
          container: 'swal-container',
          popup: 'swal-popup-success',
          title: 'swal-title-success',
          htmlContainer: 'swal-content-success',
          confirmButton: 'swal-confirm-success'
        }
      });
    } else if (type === 'delete') {
      Swal.fire({
        title: 'Cancellazione Completata!',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <div style="margin: 1rem 0; font-size: 3rem; color: #28a745;">
              <i class="fas fa-calendar-alt"></i>
              <i class="fas fa-arrow-right" style="margin: 0 0.5rem; color: #6c757d;"></i>
              <i class="fas fa-trash"></i>
              <i class="fas fa-arrow-right" style="margin: 0 0.5rem; color: #6c757d;"></i>
              <i class="fas fa-check"></i>
            </div>
            <p>Prenotazione cancellata correttamente.</p>
            <small style="color: #6c757d;">Il ristorante è stato notificato e riceverai una conferma via email.</small>
          </div>
        `,
        icon: 'success',
        confirmButtonText: '<i class="fas fa-check"></i> Ho capito',
        confirmButtonColor: '#28a745',
        timer: 4000,
        timerProgressBar: true,
        customClass: {
          container: 'swal-container',
          popup: 'swal-popup-success',
          title: 'swal-title-success',
          htmlContainer: 'swal-content-success',
          confirmButton: 'swal-confirm-success'
        }
      });
    }
  }

  // 🍬 SWEETALERT2 ERROR MESSAGES  
  private showErrorMessage(message: string): void {
    Swal.fire({
      title: 'Ops! Qualcosa è andato storto',
      text: message,
      icon: 'error',
      confirmButtonText: '<i class="fas fa-times"></i> Chiudi',
      confirmButtonColor: '#dc3545',
      customClass: {
        container: 'swal-container',
        popup: 'swal-popup-error',
        title: 'swal-title-error',
        confirmButton: 'swal-confirm-error'
      }
    });
  }

  isValidEditData(): boolean {
    return this.editData.numberOfPeople >= 1 && 
           this.editData.numberOfPeople <= 20 && 
           this.editData.reservationDate !== '' && 
           this.editData.reservationTime !== '';
  }

  // 🚀 ESECUZIONE AZIONI - CON SWEETALERT2

  // ✏️ Esegue modifica con SweetAlert2
  private executeEdit(reservationId: number): void {
    this.loading = true;
    
    const updateData = {
      numberOfPeople: this.editData.numberOfPeople,
      reservationDate: this.editData.reservationDate,
      reservationTime: this.editData.reservationTime,
      notes: this.editData.notes || undefined
    };

    console.log('🔄 Inviando aggiornamento al backend:', updateData);

    this.reservationService.updateReservation(reservationId, updateData).subscribe({
      next: (updatedReservation) => {
        this.loading = false;
        console.log('✅ Prenotazione aggiornata dal backend:', updatedReservation);
        
        this.updateReservationInLists(updatedReservation);
        
        // 🍬 MOSTRA SWEETALERT2 SUCCESS
        this.showSuccessMessage('edit');
        
        this.reservationUpdated.emit();
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Errore nella modifica:', error);
        this.showErrorMessage('Errore durante la modifica. Riprova più tardi.');
      }
    });
  }

  // 🗑️ Esegue cancellazione con SweetAlert2
  private executeCancel(reservationId: number): void {
    this.loading = true;
    
    console.log('🗑️ Inviando cancellazione al backend per ID:', reservationId);

    this.reservationService.deleteReservation(reservationId).subscribe({
      next: () => {
        this.loading = false;
        console.log('✅ Prenotazione cancellata dal backend');
        
        this.removeReservationFromLists(reservationId);
        
        // 🍬 MOSTRA SWEETALERT2 SUCCESS
        this.showSuccessMessage('delete');
        
        this.reservationUpdated.emit();
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Errore nella cancellazione:', error);
        this.showErrorMessage('Errore durante la cancellazione. Riprova più tardi.');
      }
    });
  }

  // 🔧 GESTIONE LISTE LOCALI

  private removeReservationFromLists(reservationId: number): void {
    this.reservations = this.reservations.filter(r => r.id !== reservationId);
    this.upcomingReservations = this.upcomingReservations.filter(r => r.id !== reservationId);
    this.pastReservations = this.pastReservations.filter(r => r.id !== reservationId);
    this.applyFilter();
  }

  private updateReservationInLists(updatedReservation: IReservation): void {
    const updateArrays = [this.reservations, this.upcomingReservations, this.pastReservations];
    
    updateArrays.forEach(array => {
      const index = array.findIndex(r => r.id === updatedReservation.id);
      if (index !== -1) {
        array[index] = updatedReservation;
      }
    });
    
    this.categorizeReservations();
    this.applyFilter();
  }

  // 🔧 UTILITY METHODS

  formatDate(date: string): string {
    try {
      return new Date(date).toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return date;
    }
  }

  formatTime(time: string): string {
    try {
      return time.slice(0, 5);
    } catch (error) {
      return time;
    }
  }

  getStatusIcon(reservation: IReservation): string {
    const isFuture = this.isReservationFuture(reservation, new Date());
    return isFuture ? 'fas fa-clock text-warning' : 'fas fa-check-circle text-success';
  }

  getStatusText(reservation: IReservation): string {
    const isFuture = this.isReservationFuture(reservation, new Date());
    return isFuture ? 'Prossima' : 'Completata';
  }

  trackByReservation(index: number, reservation: IReservation): number {
    return reservation.id;
  }

  // 📊 GETTERS

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

  get minDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}