import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IRestaurant } from '../../models/i-restaurant';

interface BookingStep {
  step: 'date' | 'time' | 'people' | 'confirm';
  title: string;
}

interface BookingData {
  date: Date | null;
  time: string | null;
  people: number;
  discount: string;
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
  @Output() bookingConfirmed = new EventEmitter<BookingData>();

  currentStep: BookingStep['step'] = 'date';
  currentMonth = new Date();

  bookingData: BookingData = {
    date: null,
    time: null,
    people: 2,
    discount: '-20%'
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
  }

  goToPreviousStep() {
    const steps = ['date', 'time', 'people', 'confirm'];
    const currentIndex = steps.indexOf(this.currentStep);
    if (currentIndex > 0) {
      this.currentStep = steps[currentIndex - 1] as BookingStep['step'];
    }
  }

  // Gestione modale
  close() {
    this.closeModal.emit();
    this.resetBooking();
  }

  confirmBooking() {
    this.bookingConfirmed.emit({ ...this.bookingData });
    this.close();
  }

  resetBooking() {
    this.currentStep = 'date';
    this.bookingData = {
      date: null,
      time: null,
      people: 2,
      discount: '-20%'
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
}
