import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IRestaurant } from '../../models/i-restaurant';
import { ReservationService, CreateReservationRequest } from '../../services/reservation';
import { AuthService } from '../../services/auth';
import Swal from 'sweetalert2'; // 🍬 IMPORT SWEETALERT2

interface BookingStep {
  step: 'date' | 'time' | 'people' | 'confirm';
  title: string;
}

interface BookingData {
  date: Date | null;
  time: string | null;
  people: number;
  discount: string;
  notes?: string;
  customerPhone?: string;
}

@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-modal.html',
  styleUrls: ['./booking-modal.css']
})
export class BookingModalComponent implements OnInit {
  @Input() restaurant: IRestaurant | null = null;
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() bookingConfirmed = new EventEmitter<any>();

  currentStep: BookingStep['step'] = 'date';
  currentMonth = new Date();

  // Loading e stato
  isSubmitting = false;
  submissionError: string | null = null;

  bookingData: BookingData = {
    date: null,
    time: null,
    people: 2,
    discount: '-20%',
    notes: '',
    customerPhone: ''
  };

  steps: BookingStep[] = [
    { step: 'date', title: 'Scegli una data disponibile' },
    { step: 'time', title: 'Scegli un orario disponibile' },
    { step: 'people', title: 'Indica il numero di persone' },
    { step: 'confirm', title: 'Controlla i dettagli della prenotazione' }
  ];

  // Orari disponibili
  lunchTimes = [
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'
  ];

  dinnerTimes = [
    '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentMonth = new Date();
  }

  // Gestione calendario
  getDaysInMonth(): (Date | null)[] {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);

    startDate.setDate(startDate.getDate() - (startDate.getDay() || 7) + 1);

    const days: (Date | null)[] = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      if (current.getMonth() === month) {
        days.push(new Date(current));
      } else {
        days.push(null);
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  isDateAvailable(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date >= today && date <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  getDateDiscount(date: Date): string {
    const dayOfWeek = date.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 4) return '-20%'; // Lun-Gio
    if (dayOfWeek === 5) return '-15%'; // Ven
    return '-10%'; // Weekend
  }

  selectDate(date: Date) {
    if (!this.isDateAvailable(date)) return;

    this.bookingData.date = date;
    this.bookingData.discount = this.getDateDiscount(date);
    this.goToStep('time');
  }

  selectTime(time: string) {
    this.bookingData.time = time;
    this.goToStep('people');
  }

  selectPeople(people: number) {
    this.bookingData.people = people;
    this.goToStep('confirm');
  }

  // Navigazione steps
  goToStep(step: BookingStep['step']) {
    this.currentStep = step;
    this.submissionError = null;
  }

  goToPreviousStep() {
    const steps = ['date', 'time', 'people', 'confirm'];
    const currentIndex = steps.indexOf(this.currentStep);
    if (currentIndex > 0) {
      this.currentStep = steps[currentIndex - 1] as BookingStep['step'];
    }
  }

  // 🔧 CONFERMA PRENOTAZIONE - CON SWEETALERT2
  confirmBooking() {
    if (!this.restaurant || !this.bookingData.date || !this.bookingData.time) {
      this.submissionError = 'Dati prenotazione incompleti';
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.submissionError = 'Devi essere loggato per prenotare';
      return;
    }

    if (!this.bookingData.customerPhone || this.bookingData.customerPhone.trim() === '') {
      this.submissionError = 'Il numero di telefono è obbligatorio';
      return;
    }

    this.isSubmitting = true;
    this.submissionError = null;

    try {
      // Prepara dati prenotazione
      const reservationData: CreateReservationRequest = this.reservationService.createReservationFromBookingData(
        this.bookingData,
        this.restaurant.id,
        this.authService.getUserId(),
        this.authService.getUserFullName(),
        this.bookingData.customerPhone,
        this.bookingData.notes
      );

      console.log('📤 Creazione prenotazione:', reservationData);

      // Invia prenotazione al backend
      this.reservationService.createReservation(reservationData).subscribe({
        next: (reservation) => {
          console.log('✅ Prenotazione creata con successo:', reservation);
          this.isSubmitting = false;

          // 🍬 SWEETALERT2 SUCCESS - BELLISSIMO!
          this.showBookingSuccessAlert(reservation);

          // Emetti evento di successo
          this.bookingConfirmed.emit({
            ...this.bookingData,
            reservationId: reservation.id,
            restaurant: this.restaurant
          });

          this.close();
        },
        error: (error) => {
          console.error('❌ Errore creazione prenotazione:', error);
          this.isSubmitting = false;

          // 🍬 SWEETALERT2 ERROR
          this.showBookingErrorAlert(error.error?.message || 'Errore nella creazione della prenotazione. Riprova.');
        }
      });

    } catch (error: any) {
      console.error('❌ Errore validazione:', error);
      this.isSubmitting = false;

      // 🍬 SWEETALERT2 ERROR
      this.showBookingErrorAlert(error.message || 'Errore nella validazione dei dati');
    }
  }

  // 🍬 SWEETALERT2 SUCCESS - ANIMATO E CARINO
  private showBookingSuccessAlert(reservation: any): void {
    const formattedDate = this.formatFullDate(this.bookingData.date!);
    const formattedTime = this.bookingData.time;

    Swal.fire({
      title: '🎉 Prenotazione Confermata!',
      html: `
        <div style="text-align: center; margin: 2rem 0;">
          <!-- Animazione icone -->
          <div style="margin: 1.5rem 0; font-size: 4rem; color: #28a745;">
            <i class="fas fa-calendar-check" style="animation: bounceIn 1s ease-out;"></i>
          </div>

          <!-- Dettagli prenotazione -->
          <div style="background: #f8f9fa; border-radius: 12px; padding: 1.5rem; margin: 1rem 0; border-left: 4px solid #28a745;">
            <h4 style="color: #28a745; margin-bottom: 1rem; font-weight: 600;">
              <i class="fas fa-utensils"></i> ${this.restaurant?.name}
            </h4>

            <div style="display: flex; flex-direction: column; gap: 0.75rem; text-align: left;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-calendar" style="color: #28a745; width: 20px;"></i>
                <strong>${formattedDate}</strong>
              </div>

              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-clock" style="color: #28a745; width: 20px;"></i>
                <strong>${formattedTime}</strong>
              </div>

              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-users" style="color: #28a745; width: 20px;"></i>
                <strong>${this.bookingData.people} ${this.bookingData.people === 1 ? 'persona' : 'persone'}</strong>
              </div>

              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-phone" style="color: #28a745; width: 20px;"></i>
                <strong>${this.bookingData.customerPhone}</strong>
              </div>

              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-ticket-alt" style="color: #dc3545; width: 20px;"></i>
                <strong style="color: #dc3545;">${this.bookingData.discount} di sconto!</strong>
              </div>
            </div>
          </div>

          <!-- ID Prenotazione -->
          <div style="background: #28a745; color: white; padding: 0.75rem; border-radius: 8px; margin: 1rem 0;">
            <strong>ID Prenotazione: #${reservation.id}</strong>
          </div>

          <!-- Messaggio -->
          <p style="color: #6c757d; margin: 1rem 0; line-height: 1.5;">
            <i class="fas fa-envelope" style="color: #28a745;"></i>
            Riceverai una conferma via email con tutti i dettagli della prenotazione.
          </p>

          <!-- Prossimi passi -->
          <div style="background: #e7f3ff; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <h6 style="color: #0066cc; margin-bottom: 0.5rem;">
              <i class="fas fa-info-circle"></i> Prossimi passi:
            </h6>
            <ul style="text-align: left; color: #0066cc; margin: 0; padding-left: 1.5rem;">
              <li>Arriva 5 minuti prima dell'orario prenotato</li>
              <li>Presenta il tuo nome alla reception</li>
              <li>Goditi il tuo ${this.bookingData.discount} di sconto!</li>
            </ul>
          </div>
        </div>
      `,
      icon: 'success',
      confirmButtonText: '<i class="fas fa-check"></i> Perfetto!',
      confirmButtonColor: '#28a745',
      width: '600px',
      timer: 8000,
      timerProgressBar: true,
      showCloseButton: true,
      allowOutsideClick: false,
      customClass: {
        container: 'booking-success-modal',
        popup: 'booking-success-popup',
        title: 'booking-success-title',
        confirmButton: 'booking-success-button'
      },
      didOpen: () => {
        // Aggiungi animazioni CSS custom
        const style = document.createElement('style');
        style.textContent = `
          @keyframes bounceIn {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
          }

          .booking-success-popup {
            border-radius: 16px !important;
            box-shadow: 0 20px 60px rgba(40, 167, 69, 0.3) !important;
          }

          .booking-success-button {
            border-radius: 25px !important;
            padding: 12px 24px !important;
            font-weight: 600 !important;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3) !important;
          }
        `;
        document.head.appendChild(style);
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Opzionale: redirect alla dashboard delle prenotazioni
        console.log('🎯 Utente ha confermato - possibile redirect a dashboard');
      }
    });
  }

  // 🍬 SWEETALERT2 ERROR - ELEGANTE
  private showBookingErrorAlert(errorMessage: string): void {
    Swal.fire({
      title: '❌ Prenotazione Non Riuscita',
      html: `
        <div style="text-align: center; margin: 1.5rem 0;">
          <div style="margin: 1rem 0; font-size: 3rem; color: #dc3545;">
            <i class="fas fa-exclamation-triangle"></i>
          </div>

          <div style="background: #f8d7da; border-radius: 8px; padding: 1rem; margin: 1rem 0; border-left: 4px solid #dc3545;">
            <p style="color: #721c24; margin: 0; font-weight: 500;">
              ${errorMessage}
            </p>
          </div>

          <div style="background: #e2e3e5; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <h6 style="color: #6c757d; margin-bottom: 0.5rem;">
              <i class="fas fa-lightbulb"></i> Cosa puoi fare:
            </h6>
            <ul style="text-align: left; color: #6c757d; margin: 0; padding-left: 1.5rem;">
              <li>Verifica tutti i dati inseriti</li>
              <li>Prova un orario diverso</li>
              <li>Controlla la connessione internet</li>
              <li>Riprova tra qualche minuto</li>
            </ul>
          </div>
        </div>
      `,
      icon: 'error',
      confirmButtonText: '<i class="fas fa-redo"></i> Riprova',
      confirmButtonColor: '#dc3545',
      width: '500px',
      customClass: {
        popup: 'booking-error-popup',
        confirmButton: 'booking-error-button'
      },
      didOpen: () => {
        const style = document.createElement('style');
        style.textContent = `
          .booking-error-popup {
            border-radius: 16px !important;
            box-shadow: 0 20px 60px rgba(220, 53, 69, 0.3) !important;
          }

          .booking-error-button {
            border-radius: 25px !important;
            padding: 12px 24px !important;
            font-weight: 600 !important;
          }
        `;
        document.head.appendChild(style);
      }
    });
  }

  // Gestione modale
  close() {
    this.closeModal.emit();
    this.resetBooking();
  }

  resetBooking() {
    this.currentStep = 'date';
    this.isSubmitting = false;
    this.submissionError = null;
    this.bookingData = {
      date: null,
      time: null,
      people: 2,
      discount: '-20%',
      notes: '',
      customerPhone: ''
    };
  }

  // Utility
  formatDate(date: Date): string {
    return date.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  formatFullDate(date: Date): string {
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getMonthName(): string {
    return this.currentMonth.toLocaleDateString('it-IT', {
      month: 'long',
      year: 'numeric'
    });
  }

  previousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1);
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
  }

  getStepTitle(): string {
    return this.steps.find(s => s.step === this.currentStep)?.title || '';
  }

  // Getters per il template
  get currentUser() {
    return {
      name: this.authService.getUserFullName(),
      email: this.authService.getUserEmail(),
      phone: this.authService.getUserPhone()
    };
  }

  get isLoggedIn() {
    return this.authService.isLoggedIn();
  }
}
