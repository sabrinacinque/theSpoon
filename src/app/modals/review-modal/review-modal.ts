// modals/review-modal/review-modal.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService, ICreateReviewRequest, IUpdateReviewRequest, IReview } from '../../services/review.service';
import { AuthService } from '../../services/auth';
import { IRestaurant } from '../../models/i-restaurant';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-modal.html',
  styleUrls: ['./review-modal.css']
})
export class ReviewModalComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() restaurant: IRestaurant | null = null;
  @Input() editingReview: IReview | null = null; // Per modificare review esistente
  @Output() closeModal = new EventEmitter<void>();
  @Output() reviewSubmitted = new EventEmitter<IReview>();
  Math = Math;

  // 📝 Form Data
  reviewForm = {
    ratingGeneral: 0,
    ratingAtmosfera: 0,
    ratingCibo: 0,
    ratingServizio: 0,
    comment: ''
  };

  // 🎯 UI States
  loading = false;
  error: string | null = null;
  isEditMode = false;
  currentStep = 1; // 1 = ratings, 2 = commento, 3 = conferma
  maxSteps = 3;

  // ⭐ Rating Labels
  ratingLabels = {
    ratingGeneral: 'Valutazione Generale',
    ratingAtmosfera: 'Atmosfera',
    ratingCibo: 'Qualità del Cibo',
    ratingServizio: 'Servizio'
  };

  // 🎨 Rating Descriptions (1-10)
  ratingDescriptions: { [key: number]: string } = {
    1: 'Pessimo',
    2: 'Molto Male',
    3: 'Male',
    4: 'Scarso',
    5: 'Sufficiente',
    6: 'Discreto',
    7: 'Buono',
    8: 'Molto Buono',
    9: 'Eccellente',
    10: 'Perfetto'
  };

  constructor(
    private reviewService: ReviewService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('🎭 ReviewModal inizializzato');
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.initializeModal();
    }
  }

  // 🎯 Inizializza modal quando si apre
  private initializeModal() {
    this.error = null;
    this.loading = false;
    this.currentStep = 1;

    // Controlla se stiamo modificando una review esistente
    if (this.editingReview) {
      this.isEditMode = true;
      this.loadEditingReview();
    } else {
      this.isEditMode = false;
      this.resetForm();
    }

    // Previeni scroll body
    document.body.classList.add('modal-open');

    console.log('🎭 Modal inizializzato:', {
      restaurant: this.restaurant?.name,
      editMode: this.isEditMode,
      editingReview: this.editingReview?.id
    });
  }

  // ✏️ Carica dati per modifica
  private loadEditingReview() {
    if (this.editingReview) {
      this.reviewForm = {
        ratingGeneral: this.editingReview.ratingGeneral,
        ratingAtmosfera: this.editingReview.ratingAtmosfera,
        ratingCibo: this.editingReview.ratingCibo,
        ratingServizio: this.editingReview.ratingServizio,
        comment: this.editingReview.comment || ''
      };
      console.log('✏️ Review caricata per modifica:', this.reviewForm);
    }
  }

  // 🔄 Reset form
  private resetForm() {
    this.reviewForm = {
      ratingGeneral: 0,
      ratingAtmosfera: 0,
      ratingCibo: 0,
      ratingServizio: 0,
      comment: ''
    };
  }

  // ❌ Chiudi modal
  close() {
    console.log('❌ Chiusura modal review');

    // FIX: Chiudi tutti i modal SweetAlert2 aperti
    Swal.close();

    // Rimuovi classe modal-open
    document.body.classList.remove('modal-open');

    // Emetti evento di chiusura
    this.closeModal.emit();
  }

  // ⭐ Imposta rating per categoria
  setRating(category: keyof typeof this.reviewForm, rating: number) {
    if (['ratingGeneral', 'ratingAtmosfera', 'ratingCibo', 'ratingServizio'].includes(category)) {
      (this.reviewForm as any)[category] = rating;
      console.log(`⭐ Rating ${category}: ${rating}`);
    }
  }

  // 🎨 Ottieni array di stelle per rating
  getStarsArray(rating: number): number[] {
    return Array.from({ length: 10 }, (_, i) => i + 1);
  }

  // 🎨 Verifica se stella è attiva
  isStarActive(rating: number, starNumber: number): boolean {
    return starNumber <= rating;
  }

  // 🎨 Ottieni descrizione rating
  getRatingDescription(rating: number): string {
    return this.ratingDescriptions[rating] || '';
  }

  // 🎨 Ottieni colore per rating
  getRatingColor(rating: number): string {
    if (rating >= 8) return '#22c55e'; // verde
    if (rating >= 6) return '#f59e0b'; // arancione
    if (rating >= 4) return '#ef4444'; // rosso
    return '#6b7280'; // grigio
  }

  // 📋 Validazione step corrente
  canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.reviewForm.ratingGeneral > 0 &&
               this.reviewForm.ratingAtmosfera > 0 &&
               this.reviewForm.ratingCibo > 0 &&
               this.reviewForm.ratingServizio > 0;
      case 2:
        return true; // Commento opzionale
      case 3:
        return true;
      default:
        return false;
    }
  }

  // ➡️ Prossimo step
  nextStep() {
    if (this.canProceedToNextStep() && this.currentStep < this.maxSteps) {
      this.currentStep++;
      console.log(`➡️ Step ${this.currentStep}/${this.maxSteps}`);
    }
  }

  // ⬅️ Step precedente
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      console.log(`⬅️ Step ${this.currentStep}/${this.maxSteps}`);
    }
  }

  // 📊 Calcola rating medio
  get averageRating(): number {
    const total = this.reviewForm.ratingGeneral +
                  this.reviewForm.ratingAtmosfera +
                  this.reviewForm.ratingCibo +
                  this.reviewForm.ratingServizio;
    return Math.round((total / 4) * 10) / 10;
  }

  // ✅ Invia review
  submitReview() {
    if (!this.canSubmit()) {
      this.error = 'Completa tutti i rating obbligatori';
      return;
    }

    const currentUser = this.authService.currentUser();
    if (!currentUser || !this.restaurant) {
      this.error = 'Errore: utente o ristorante non trovato';
      return;
    }

    this.loading = true;
    this.error = null;

    if (this.isEditMode && this.editingReview) {
      this.updateExistingReview(currentUser.userId);
    } else {
      this.createNewReview(currentUser.userId);
    }
  }

  // 📝 Crea nuova review
  private createNewReview(customerId: number) {
    const reviewData: ICreateReviewRequest = {
      customerId: customerId,
      restaurantId: this.restaurant!.id,
      ratingGeneral: this.reviewForm.ratingGeneral,
      ratingAtmosfera: this.reviewForm.ratingAtmosfera,
      ratingCibo: this.reviewForm.ratingCibo,
      ratingServizio: this.reviewForm.ratingServizio,
      comment: this.reviewForm.comment.trim() || undefined
    };

    console.log('📝 Creazione nuova review:', reviewData);

    this.reviewService.createReview(reviewData).subscribe({
      next: (review) => {
        console.log('✅ Review creata con successo:', review);
        this.loading = false;

        // FIX: Chiudi il modal PRIMA di mostrare il messaggio
        this.reviewSubmitted.emit(review);
        this.close();

        // DOPO la chiusura, mostra il messaggio
        setTimeout(() => {
          this.showSuccessMessage();
        }, 100);
      },
      error: (error) => {
        console.error('❌ Errore creazione review:', error);
        this.loading = false;
        this.error = error.error?.message || 'Errore nella creazione della recensione';
      }
    });
  }

  // ✏️ Aggiorna review esistente
  private updateExistingReview(customerId: number) {
    const reviewData: IUpdateReviewRequest = {
      ratingGeneral: this.reviewForm.ratingGeneral,
      ratingAtmosfera: this.reviewForm.ratingAtmosfera,
      ratingCibo: this.reviewForm.ratingCibo,
      ratingServizio: this.reviewForm.ratingServizio,
      comment: this.reviewForm.comment.trim() || undefined
    };

    console.log('✏️ Aggiornamento review:', { id: this.editingReview!.id, data: reviewData });

    this.reviewService.updateReview(this.editingReview!.id, customerId, reviewData).subscribe({
      next: (review) => {
        console.log('✅ Review aggiornata con successo:', review);
        this.loading = false;

        // FIX: Chiudi il modal PRIMA di mostrare il messaggio
        this.reviewSubmitted.emit(review);
        this.close();

        // DOPO la chiusura, mostra il messaggio
        setTimeout(() => {
          this.showUpdateSuccessMessage();
        }, 100);
      },
      error: (error) => {
        console.error('❌ Errore aggiornamento review:', error);
        this.loading = false;
        this.error = error.error?.message || 'Errore nell\'aggiornamento della recensione';
      }
    });
  }

  // 🎉 Messaggio successo creazione - FIX: Più semplice e senza timer
  private showSuccessMessage() {
    Swal.fire({
      title: '🎉 Recensione Pubblicata!',
      html: `
        <div class="text-center">
          <div class="mb-3">
            <div class="fs-1 mb-2">⭐</div>
            <h4>Grazie per la tua recensione!</h4>
          </div>
          <div class="mb-3">
            <strong>${this.restaurant?.name}</strong><br>
            <span class="text-muted">Rating medio: ${this.averageRating}/10</span>
          </div>
          <div class="alert alert-success">
            <small>La tua recensione è ora visibile a tutti gli utenti!</small>
          </div>
        </div>
      `,
      confirmButtonText: 'Perfetto!',
      confirmButtonColor: '#22c55e',
      allowOutsideClick: true,
      allowEscapeKey: true,
      focusConfirm: true
    });
  }

  // 🎉 Messaggio successo aggiornamento - FIX: Più semplice e senza timer
  private showUpdateSuccessMessage() {
    Swal.fire({
      title: '✅ Recensione Aggiornata!',
      html: `
        <div class="text-center">
          <div class="mb-3">
            <div class="fs-1 mb-2">✏️</div>
            <h4>Recensione modificata con successo!</h4>
          </div>
          <div class="mb-3">
            <span class="text-muted">Nuovo rating medio: ${this.averageRating}/10</span>
          </div>
        </div>
      `,
      confirmButtonText: 'Perfetto!',
      confirmButtonColor: '#3b82f6',
      allowOutsideClick: true,
      allowEscapeKey: true,
      focusConfirm: true
    });
  }

  // ✅ Validazione finale
  public canSubmit(): boolean {
    return this.reviewForm.ratingGeneral > 0 &&
           this.reviewForm.ratingAtmosfera > 0 &&
           this.reviewForm.ratingCibo > 0 &&
           this.reviewForm.ratingServizio > 0 &&
           !this.loading;
  }

  // 📱 Gestione click esterno per chiudere
  onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  // ⌨️ Gestione ESC per chiudere
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  // 🎨 Ottieni titolo modal
  get modalTitle(): string {
    if (this.isEditMode) {
      return 'Modifica Recensione';
    }
    return 'Scrivi una Recensione';
  }

  // 🎨 Ottieni sottotitolo modal
  get modalSubtitle(): string {
    return this.restaurant?.name || 'Ristorante';
  }
}
