// my-reviews.ts
import { Component, Input, OnInit, OnChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReviewService, IReview } from '../../../../services/review.service'; // STESSA del restaurant-detail
import { ReviewModalComponent } from '../../../../modals/review-modal/review-modal';
import { IUser } from '../../../../models/iuser';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-my-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReviewModalComponent],
  templateUrl: './my-reviews.html',
  styleUrls: ['./my-reviews.css']
})
export class MyReviews implements OnInit, OnChanges {
  @Input() currentUser: IUser | null = null;

  // 📊 Stati componente
  loading = false;
  error: string | null = null;

  // ⭐ Review data
  userReviews: IReview[] = [];
  filteredReviews: IReview[] = [];

  // 🎯 Review modal
  isReviewModalOpen = false;
  editingReview: IReview | null = null;
  selectedRestaurant: any | null = null;

  // 🔍 Filtri e ordinamento
  searchTerm = '';
  sortBy: 'date' | 'rating' | 'restaurant' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  filterRating: number | null = null;

  // FIX per trackByFn
  trackByFn = (index: number, item: IReview) => item.id || index;

  constructor(
    private reviewService: ReviewService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.currentUser) {
      this.loadUserReviews();
    }
  }

  ngOnChanges(): void {
    if (this.currentUser) {
      this.loadUserReviews();
    }
  }

  // 📥 CARICA RECENSIONI UTENTE
  private loadUserReviews(): void {
    if (!this.currentUser) return;

    this.loading = true;
    this.error = null;

    this.reviewService.getReviewsByCustomer(this.currentUser.userId).subscribe({
      next: (reviews: IReview[]) => {
        this.userReviews = reviews;
        this.applyFiltersAndSort();
        this.loading = false;
        this.cdr.detectChanges();
        console.log('⭐ Review utente caricate:', reviews.length);
      },
      error: (error) => {
        console.error('❌ Errore caricamento review:', error);
        this.error = 'Errore nel caricamento delle recensioni';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 🔍 APPLICA FILTRI E ORDINAMENTO
  private applyFiltersAndSort(): void {
    let filtered = [...this.userReviews];

    // Filtro per testo (nome ristorante o commento)
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(review =>
        review.restaurant.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (review.comment && review.comment.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    // Filtro per rating minimo
    if (this.filterRating !== null) {
      filtered = filtered.filter(review => review.ratingGeneral >= this.filterRating!);
    }

    // Ordinamento
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'rating':
          comparison = a.ratingGeneral - b.ratingGeneral;
          break;
        case 'restaurant':
          comparison = a.restaurant.name.localeCompare(b.restaurant.name);
          break;
      }

      return this.sortOrder === 'desc' ? -comparison : comparison;
    });

    this.filteredReviews = filtered;
  }

  // 🔍 GESTIONE RICERCA
  onSearchChange(): void {
    this.applyFiltersAndSort();
  }

  // 📊 GESTIONE ORDINAMENTO
  onSortChange(): void {
    this.applyFiltersAndSort();
  }

  // ⭐ GESTIONE FILTRO RATING
  onRatingFilterChange(): void {
    this.applyFiltersAndSort();
  }

  // 🔄 REFRESH DATI
  refreshReviews(): void {
    this.loadUserReviews();
  }

  // ✏️ APRI MODAL MODIFICA
  openEditReviewModal(review: IReview): void {
    this.editingReview = review;

    // Usa i dati restaurant dalla review (stessa struttura del restaurant-detail)
    this.selectedRestaurant = {
      id: review.restaurant.id,
      name: review.restaurant.name,
      city: review.restaurant.city,
      description: '',
      address: '',
      phoneNumber: '',
      partitaIva: '',
      rating: 0,
      imageUrl: '',
      cuisine: '',
      priceRange: ''
    };

    this.isReviewModalOpen = true;
    console.log('✏️ Apertura modal modifica review:', review.id);
  }

  // ❌ CHIUDI MODAL
  closeReviewModal(): void {
    this.isReviewModalOpen = false;
    this.editingReview = null;
    this.selectedRestaurant = null;
    console.log('❌ Chiusura modal review');
  }

  // ✅ REVIEW AGGIORNATA
  onReviewSubmitted(review: IReview): void {
    console.log('✅ Review aggiornata:', review);
    this.loadUserReviews(); // Ricarica la lista
    this.closeReviewModal(); // Chiudi il modal
  }

  // 🗑️ ELIMINA REVIEW
  async deleteReview(review: IReview): Promise<void> {
    const result = await Swal.fire({
      title: 'Elimina Recensione',
      html: `
        <div style="text-align: left; margin: 1rem 0;">
          <p style="margin-bottom: 1rem;"><strong>Stai per eliminare la tua recensione per:</strong></p>
          <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
            <h5 style="margin: 0 0 0.5rem 0; color: #333;">${review.restaurant.name}</h5>
            <p style="margin: 0; color: #666;">Rating: ${review.ratingGeneral}/10 • ${this.formatReviewDate(review.createdAt)}</p>
          </div>
          <p style="margin-top: 1rem;"><strong>⚠️ Questa azione non può essere annullata!</strong></p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fas fa-trash"></i> Sì, elimina',
      cancelButtonText: '<i class="fas fa-times"></i> Annulla',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      this.reviewService.deleteReview(review.id, this.currentUser!.userId).subscribe({
        next: (response) => {
          console.log('✅ Review eliminata:', review.id, response);
          this.loadUserReviews();

          Swal.fire({
            title: 'Recensione eliminata!',
            text: 'La tua recensione è stata eliminata con successo.',
            icon: 'success',
            confirmButtonText: 'Perfetto!',
            confirmButtonColor: '#22c55e',
            timer: 3000,
            timerProgressBar: true
          });
        },
        error: (error) => {
          console.error('❌ Errore eliminazione review:', error);

          // Se l'errore è un parsing ma la richiesta è andata a buon fine (status 200)
          if (error.status === 200 && error.error?.text) {
            console.log('✅ Eliminazione riuscita (risposta come testo):', error.error.text);
            this.loadUserReviews();

            Swal.fire({
              title: 'Recensione eliminata!',
              text: 'La tua recensione è stata eliminata con successo.',
              icon: 'success',
              confirmButtonText: 'Perfetto!',
              confirmButtonColor: '#22c55e',
              timer: 3000,
              timerProgressBar: true
            });
          } else {
            Swal.fire({
              title: 'Errore',
              text: 'Si è verificato un errore durante l\'eliminazione della recensione.',
              icon: 'error',
              confirmButtonText: 'Ho capito',
              confirmButtonColor: '#dc3545'
            });
          }
        }
      });
    }
  }

  // 🎯 NAVIGA AL RISTORANTE
  goToRestaurant(restaurantId: number): void {
    console.log('🏪 Naviga al ristorante:', restaurantId);

    // Controlla se siamo in un'app mobile/PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');

    if (isStandalone) {
      // Se siamo in app, naviga nella stessa finestra
      this.router.navigate(['/restaurant', restaurantId]);
    } else {
      // Se siamo nel browser, apri nuova tab
      window.open(`/restaurant/${restaurantId}`, '_blank');
    }
  }

  // 📊 GETTERS PER STATISTICHE

  get totalReviews(): number {
    return this.userReviews.length;
  }

  get averageRating(): number {
    if (this.userReviews.length === 0) return 0;

    const total = this.userReviews.reduce((sum, review) => sum + review.ratingGeneral, 0);
    const average = total / this.userReviews.length;
    return Math.round(average * 10) / 10;
  }

  get reviewsByRating(): { [key: number]: number } {
    const counts: { [key: number]: number } = {};

    for (let i = 1; i <= 10; i++) {
      counts[i] = 0;
    }

    this.userReviews.forEach(review => {
      counts[review.ratingGeneral]++;
    });

    return counts;
  }

  get mostRecentReview(): IReview | null {
    if (this.userReviews.length === 0) return null;

    return this.userReviews.reduce((latest, current) => {
      return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
    });
  }

  get reviewsThisMonth(): number {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return this.userReviews.filter(review => {
      const reviewDate = new Date(review.createdAt);
      return reviewDate.getMonth() === thisMonth && reviewDate.getFullYear() === thisYear;
    }).length;
  }

  // 🎨 UTILITY METHODS

  formatReviewDate(dateString: string): string {
    return this.reviewService.formatReviewDate(dateString);
  }

  getStars(rating: number): string {
    if (!rating || rating === 0) return '☆☆☆☆☆';

    const fullStars = Math.floor(rating / 2); // Converti da 1-10 a 1-5
    const emptyStars = 5 - fullStars;

    return '⭐'.repeat(fullStars) + '☆'.repeat(emptyStars);
  }

  getRatingColor(rating: number): string {
    return this.reviewService.getRatingColor(rating);
  }

  getRatingEmoji(rating: number): string {
    return this.reviewService.getRatingEmoji(rating);
  }

  // 🔄 RESET FILTRI
  resetFilters(): void {
    this.searchTerm = '';
    this.sortBy = 'date';
    this.sortOrder = 'desc';
    this.filterRating = null;
    this.applyFiltersAndSort();
  }

  // 📈 OTTIENI DISTRIBUZIONE RATING
  getRatingDistribution(): { rating: number; count: number; percentage: number }[] {
    const distribution = [];
    const total = this.userReviews.length;

    for (let i = 10; i >= 1; i--) {
      const count = this.userReviews.filter(review => review.ratingGeneral === i).length;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

      if (count > 0) {
        distribution.push({ rating: i, count, percentage });
      }
    }

    return distribution;
  }

  
}
