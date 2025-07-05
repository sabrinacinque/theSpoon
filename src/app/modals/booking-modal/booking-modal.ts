import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IRestaurant } from '../../models/i-restaurant';
import { ReservationService, CreateReservationRequest } from '../../services/reservation';
import { AuthService } from '../../services/auth';

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
  customerPhone?: string; // ← NUOVO CAMPO
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
    customerPhone: '' // ← NUOVO CAMPO
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

    // Inizia dal lunedì della settimana
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

    // Disponibile se non è passata e non è più di 30 giorni nel futuro
    return date >= today && date <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  getDateDiscount(date: Date): string {
    // Logica sconto basata su giorno settimana
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
    this.submissionError = null; // Reset errore
  }

  goToPreviousStep() {
    const steps = ['date', 'time', 'people', 'confirm'];
    const currentIndex = steps.indexOf(this.currentStep);
    if (currentIndex > 0) {
      this.currentStep = steps[currentIndex - 1] as BookingStep['step'];
    }
  }

  // 🔧 CONFERMA PRENOTAZIONE REALE - CON TELEFONO DA INPUT
  confirmBooking() {
    if (!this.restaurant || !this.bookingData.date || !this.bookingData.time) {
      this.submissionError = 'Dati prenotazione incompleti';
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.submissionError = 'Devi essere loggato per prenotare';
      return;
    }

    // ✅ VALIDAZIONE TELEFONO DA INPUT
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
        this.bookingData.customerPhone, // ← USA IL TELEFONO DALL'INPUT
        this.bookingData.notes
      );

      console.log('📤 Creazione prenotazione:', reservationData);
      console.log('📅 Data selezionata:', this.bookingData.date);
      console.log('📅 Data formattata per backend:', reservationData.reservationDate);

      // Invia prenotazione al backend
      this.reservationService.createReservation(reservationData).subscribe({
        next: (reservation) => {
          console.log('✅ Prenotazione creata con successo:', reservation);
          this.isSubmitting = false;

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
          this.submissionError = error.error?.message || 'Errore nella creazione della prenotazione. Riprova.';
        }
      });

    } catch (error: any) {
      console.error('❌ Errore validazione:', error);
      this.isSubmitting = false;
      this.submissionError = error.message || 'Errore nella validazione dei dati';
    }
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
      customerPhone: '' // ← RESET TELEFONO
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

  // Getters per il template - VERSIONE UNICA
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
