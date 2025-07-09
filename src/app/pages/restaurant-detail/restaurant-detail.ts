import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from '../../services/restaurant';
import { PhotoService } from '../../services/photo.service';
import { MenuItemService } from '../../services/menu-item.service';
import { UploadService } from '../../services/upload-service';
import { AuthModalComponent } from '../../components/auth/auth-modal/auth-modal';
// ✅ NUOVI IMPORT PER REVIEW
import { ReviewService, IReview } from '../../services/review.service';
import { AuthService } from '../../services/auth';
import { IRestaurant } from '../../models/i-restaurant';
import { IPhoto } from '../../services/photo.service';
import { IMenuItem } from '../../services/menu-item.service';
import { BookingModalComponent } from '../../modals/booking-modal/booking-modal';
// ✅ IMPORT REVIEW MODAL
import { ReviewModalComponent } from '../../modals/review-modal/review-modal';
import { HostListener } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
// ✅ IMPORT SWEETALERT2
import Swal from 'sweetalert2';

interface MenuHighlight {
  name: string;
  price: number;
  category?: string;
}

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, BookingModalComponent, ReviewModalComponent, AuthModalComponent],
  templateUrl: './restaurant-detail.html',
  styleUrls: ['./restaurant-detail.css']
})
export class RestaurantDetailComponent implements OnInit, OnDestroy {

  restaurant: IRestaurant | null = null;
  photos: IPhoto[] = [];
  menuItems: IMenuItem[] = [];
  menuHighlights: MenuHighlight[] = [];
  heroImageUrl: string = '';
  currentPhotoIndex: number = 0;

  // ✅ PROPRIETÀ PER REVIEW
  reviews: IReview[] = [];
  userReview: IReview | null = null;
  reviewsLoading = false;
  reviewsError: string | null = null;

  // ✅ MODAL STATES
  isMenuModalOpen = false;
  isAuthModalOpen = false;
  isReviewModalOpen = false;
  isBookingModalOpen = false;
  isPhotoModalOpen = false;

  menuByCategory: { category: string; items: IMenuItem[] }[] = [];
  menuHighlightsByCategory: { category: string; items: IMenuItem[] }[] = [];
  editingReview: IReview | null = null;

  // Loading states
  loading = true;
  photosLoading = true;
  menuLoading = true;

  // Error states
  error: string | null = null;
  photosError: string | null = null;
  menuError: string | null = null;

  restaurantId: number | null = null;

  // Dati mock per demo
  availableDates = [
    { label: 'Oggi', date: new Date(), discount: '-20%' },
    { label: 'Domani', date: new Date(Date.now() + 86400000), discount: '-20%' },
    { label: 'Sab 06 Lug', date: new Date(Date.now() + 2 * 86400000), discount: '-20%' },
    { label: 'Dom 07 Lug', date: new Date(Date.now() + 3 * 86400000), discount: '-20%' }
  ];

  // Strengths placeholder
  strengthsFromReviews = [
    'Qualità degli ingredienti',
    'Servizio attento',
    'Atmosfera accogliente',
    'Ottimo rapporto qualità-prezzo'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restaurantService: RestaurantService,
    private photoService: PhotoService,
    private menuItemService: MenuItemService,
    private uploadService: UploadService,
    private reviewService: ReviewService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.restaurantId = +params['id'];
      if (this.restaurantId) {
        this.loadRestaurantDetail();
      }
    });

    // Verifica Bootstrap e inizializza tooltip
    setTimeout(() => {
      if (this.checkBootstrapAvailability()) {
        this.initializeTooltips();
      } else {
        console.warn('⚠️ Bootstrap non disponibile - tooltip disabilitati');
      }
    }, 500);
  }

  ngOnDestroy() {
    this.destroyTooltips();
  }

  loadRestaurantDetail() {
    if (!this.restaurantId) return;

    this.loading = true;
    this.error = null;

    this.restaurantService.getRestaurantById(this.restaurantId).subscribe({
      next: (data) => {
        console.log('✅ Dettaglio ristorante caricato:', data);
        this.restaurant = data;
        this.loading = false;

        // Carica dati aggiuntivi
        this.loadPhotos();
        this.loadMenuItems();
        this.loadReviews();

        console.log('🔧 DEBUG - loading:', this.loading, 'restaurant:', this.restaurant);
        this.cdr.detectChanges();

        // Re-inizializza tooltip dopo il caricamento
        this.initializeTooltips();
      },
      error: (err) => {
        console.error('❌ Errore caricamento dettaglio:', err);
        this.error = 'Errore nel caricamento del ristorante.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadReviews() {
    if (!this.restaurantId) return;

    this.reviewsLoading = true;
    this.reviewsError = null;

    this.reviewService.getReviewsByRestaurant(this.restaurantId).subscribe({
      next: (reviews) => {
        console.log('⭐ Review caricate:', reviews);
        this.reviews = reviews;
        this.checkUserReview();
        this.reviewsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Errore caricamento review:', err);
        this.reviewsError = 'Errore nel caricamento delle recensioni.';
        this.reviewsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private checkUserReview() {
    const currentUser = this.authService.currentUser();
    if (currentUser && this.reviews.length > 0) {
      this.userReview = this.reviews.find(review =>
        review.customer.id === currentUser.userId
      ) || null;
      console.log('👤 Review utente corrente:', this.userReview ? 'Trovata' : 'Non trovata');
    }
  }

  // ✅ REVIEW MODAL METHODS
  openReviewModal() {
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      console.log('🔒 Login richiesto per scrivere review');
      this.openAuthModal();
      return;
    }

    if (!this.authService.isCustomer()) {
      console.log('🚫 Solo i customer possono scrivere review');
      return;
    }

    this.editingReview = this.userReview;
    this.isReviewModalOpen = true;

    console.log('📝 Apertura modal review:', {
      mode: this.userReview ? 'modifica' : 'nuova',
      restaurant: this.restaurant?.name
    });
  }

  closeReviewModal() {
    console.log('❌ Chiusura modal review');
    this.isReviewModalOpen = false;
    this.editingReview = null;
  }

  onReviewSubmitted(review: IReview) {
    console.log('✅ Review sottomessa:', review);
    this.loadReviews();

    if (this.restaurantId) {
      this.restaurantService.getRestaurantById(this.restaurantId).subscribe({
        next: (updatedRestaurant) => {
          this.restaurant = updatedRestaurant;
          console.log('🔄 Ristorante aggiornato con nuovo rating:', updatedRestaurant.rating);
          this.cdr.detectChanges();
        }
      });
    }
  }

  // ✅ BOOKING METHODS - CON DEBUG MIGLIORATO
  bookTable() {
    console.log('🔄 bookTable() chiamato');
    console.log('📊 Stato canBook:', this.canBook);
    console.log('📊 Stato isAuthModalOpen:', this.isAuthModalOpen);

    if (!this.canBook) {
      console.log('🚫 Utente non autorizzato - mostro modal login');
      this.showLoginModal();
      return;
    }

    console.log('✅ Utente autorizzato - apro modal prenotazione');
    this.isBookingModalOpen = true;
  }

  openBookingModal(selectedDate?: any) {
    if (!this.canBook) {
      return; // Non fare nulla, il tooltip gestisce la UX
    }

    console.log('📅 Apri modal prenotazione:', selectedDate ?? 'tutte le date');
    this.isBookingModalOpen = true;
  }

  closeBookingModal() {
    this.isBookingModalOpen = false;
  }

  onBookingConfirmed(bookingData: any) {
    console.log('✅ Prenotazione confermata:', bookingData);
    this.closeBookingModal();
  }

  onDateClick(date: any): void {
    if (!this.canBook) {
      console.log('🚫 Click ignorato - utente non autorizzato');
      return;
    }
    this.openBookingModal(date);
  }

  // ✅ AUTH MODAL METHODS - VERSIONE SEMPLIFICATA
  private showLoginModal(): void {
    console.log('🔐 Apertura modal login direttamente...');
    this.openAuthModal();
  }

  // ✅ VERSIONE CON SWEETALERT2 - Se preferisci mantenerla
  private showLoginModalWithSwal(): void {
    console.log('🔐 Apertura modal login con SweetAlert2...');

    Swal.fire({
      title: '🔐 Accesso Richiesto',
      html: `
        <div class="text-center">
          <div class="mb-3">
            <i class="fas fa-user-lock fa-3x text-primary mb-3"></i>
          </div>
          <p class="mb-2">Per prenotare un tavolo devi essere registrato come <strong>cliente</strong>.</p>
          <p class="text-muted small">Effettua il login per accedere a tutte le funzionalità di prenotazione.</p>
        </div>
      `,
      icon: undefined,
      showCancelButton: true,
      confirmButtonText: '🚀 Accedi ora',
      cancelButtonText: '❌ Annulla',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      buttonsStyling: false,
      allowOutsideClick: true,
      allowEscapeKey: true
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('🔄 Utente ha confermato - apro modal auth...');
        this.openAuthModal();
      } else {
        console.log('❌ Login annullato dall\'utente');
      }
    });
  }

  openAuthModal() {
    console.log('🔐 Apertura modal auth - isAuthModalOpen diventa true');
    this.isAuthModalOpen = true;
    console.log('✅ isAuthModalOpen settato a:', this.isAuthModalOpen);
  }

  closeAuthModal() {
    console.log('🔒 Chiusura modal auth - isAuthModalOpen diventa false');
    this.isAuthModalOpen = false;
    console.log('✅ isAuthModalOpen settato a:', this.isAuthModalOpen);
  }

  onAuthSuccess() {
    console.log('✅ Autenticazione completata - inizio processo...');

    // Chiudi il modal auth
    this.closeAuthModal();

    // Aspetta un attimo prima di fare altre operazioni
    setTimeout(() => {
      console.log('🔄 Refresh tooltip e check canBook...');
      console.log('📊 Stato canBook dopo login:', this.canBook);

      // Refresh tooltip
      this.refreshTooltips();

      // Opzionale: Apri direttamente il modal di prenotazione
      if (this.canBook) {
        console.log('🎉 Utente ora può prenotare - apro modal prenotazione');
        this.isBookingModalOpen = true;
      } else {
        console.log('⚠️ Utente ancora non può prenotare dopo login');
      }
    }, 300);
  }

  // ✅ TOOLTIP METHODS
  private initializeTooltips(): void {
    if (!this.canBook) {
      setTimeout(() => {
        this.destroyTooltips();
        const tooltipTriggerList = Array.from(
          document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );

        tooltipTriggerList.forEach(tooltipTriggerEl => {
          try {
            new (window as any).bootstrap.Tooltip(tooltipTriggerEl, {
              trigger: 'hover focus',
              delay: { show: 200, hide: 100 },
              animation: true,
              html: false,
              placement: 'top',
              customClass: 'custom-booking-tooltip'
            });
            console.log('✅ Tooltip inizializzato per:', tooltipTriggerEl);
          } catch (error) {
            console.warn('⚠️ Errore inizializzazione tooltip:', error);
          }
        });
      }, 150);
    }
  }

  private destroyTooltips(): void {
    try {
      const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltipElements.forEach(element => {
        const tooltip = (window as any).bootstrap?.Tooltip?.getInstance(element);
        if (tooltip) {
          tooltip.dispose();
        }
      });
    } catch (error) {
      console.warn('⚠️ Errore durante cleanup tooltip:', error);
    }
  }

  private checkBootstrapAvailability(): boolean {
    return typeof (window as any).bootstrap !== 'undefined' &&
           typeof (window as any).bootstrap.Tooltip !== 'undefined';
  }

  refreshTooltips(): void {
    this.destroyTooltips();
    setTimeout(() => {
      this.initializeTooltips();
    }, 100);
  }

  // ✅ PHOTO METHODS
  private loadPhotos() {
    if (!this.restaurantId) return;

    this.photosLoading = true;
    this.photosError = null;

    this.photoService.getPhotosByRestaurant(this.restaurantId).subscribe({
      next: (photos) => {
        console.log('📸 Foto caricate:', photos);
        this.photos = photos;

        if (photos.length > 0) {
          this.heroImageUrl = this.uploadService.getImageUrl(photos[0].fileName);
        }

        this.photosLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Errore caricamento foto:', err);
        this.photosError = 'Errore nel caricamento delle foto.';
        this.photosLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  nextPhoto() {
    if (this.photos.length > 0) {
      this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.photos.length;
      this.heroImageUrl = this.uploadService.getImageUrl(this.photos[this.currentPhotoIndex].fileName);
    }
  }

  previousPhoto() {
    if (this.photos.length > 0) {
      this.currentPhotoIndex = this.currentPhotoIndex === 0 ? this.photos.length - 1 : this.currentPhotoIndex - 1;
      this.heroImageUrl = this.uploadService.getImageUrl(this.photos[this.currentPhotoIndex].fileName);
    }
  }

  openPhotoModal() {
    console.log('📸 Apri modal foto');
    this.isPhotoModalOpen = true;
    document.body.classList.add('modal-open');
  }

  closePhotoModal() {
    console.log('❌ Chiudi modal foto');
    this.isPhotoModalOpen = false;
    document.body.classList.remove('modal-open');
  }

  nextPhotoModal() {
    this.nextPhoto();
  }

  previousPhotoModal() {
    this.previousPhoto();
  }

  onPhotoLoaded() {
    console.log('✅ Foto caricata nel modal');
  }

  onPhotoError() {
    console.error('❌ Errore caricamento foto nel modal');
  }

  // ✅ MENU METHODS
  private loadMenuItems() {
    if (!this.restaurantId) return;

    this.menuLoading = true;
    this.menuError = null;

    this.menuItemService.getMenuItemsByRestaurant(this.restaurantId).subscribe({
      next: (menuItems) => {
        console.log('🍽️ Menu items caricati:', menuItems);
        this.menuItems = menuItems;
        this.organizeMenuByCategory();
        this.createMenuHighlights();
        this.menuLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Errore caricamento menu:', err);
        this.menuError = 'Errore nel caricamento del menu.';
        this.menuLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private organizeMenuByCategory() {
    const categoriesMap = new Map<string, IMenuItem[]>();

    this.menuItems.forEach(item => {
      const category = item.category || 'Altri piatti';
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, []);
      }
      categoriesMap.get(category)!.push(item);
    });

    this.menuByCategory = Array.from(categoriesMap.entries())
      .map(([category, items]) => ({
        category,
        items: items.sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }

  private createMenuHighlights() {
    this.menuHighlightsByCategory = this.menuByCategory.map(categoryGroup => ({
      category: categoryGroup.category,
      items: categoryGroup.items.slice(0, 2)
    })).filter(group => group.items.length > 0);
  }

  openMenuModal() {
    console.log('📋 Apri modal menu');
    this.isMenuModalOpen = true;
    document.body.classList.add('menu-modal-open');
  }

  closeMenuModal() {
    console.log('❌ Chiudi modal menu');
    this.isMenuModalOpen = false;
    document.body.classList.remove('menu-modal-open');
  }

  viewFullMenu() {
    console.log('📋 Visualizza menù completo');
    this.openMenuModal();
  }

  // ✅ UTILITY METHODS
  goBack() {
    this.router.navigate(['/']);
  }

  toggleFavorite() {
    console.log('💖 Toggle preferito per ristorante:', this.restaurantId);
  }

  shareRestaurant() {
    console.log('📤 Condividi ristorante:', this.restaurantId);
  }

  viewAllReviews() {
    console.log('⭐ Visualizza tutte le recensioni');
    console.log('📋 Review caricate:', this.reviews);
  }

  selectDate(date: any) {
    console.log('📅 Data selezionata:', date);
    this.openBookingModal(date);
  }

  getStars(rating: number): string {
    if (!rating || rating === 0) return '⭐';

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    let stars = '⭐'.repeat(fullStars);
    if (hasHalfStar && fullStars < 5) {
      stars += '⭐';
    }

    return stars || '⭐';
  }

  getPriceRange(): string {
    if (this.menuItems.length > 0) {
      const prices = this.menuItems.map(item => item.price);
      const avgPrice = prices.reduce((a, b) => a + b, 0) * 3 / prices.length;
      return `${Math.round(avgPrice)} €`;
    }
    return '25 €';
  }

  // ✅ KEYBOARD LISTENER
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.isPhotoModalOpen) {
      switch (event.key) {
        case 'Escape':
          this.closePhotoModal();
          break;
        case 'ArrowLeft':
          if (this.photoCount > 1) {
            this.previousPhotoModal();
          }
          break;
        case 'ArrowRight':
          if (this.photoCount > 1) {
            this.nextPhotoModal();
          }
          break;
      }
    }

    if (this.isMenuModalOpen) {
      switch (event.key) {
        case 'Escape':
          this.closeMenuModal();
          break;
      }
    }

    if (this.isReviewModalOpen) {
      switch (event.key) {
        case 'Escape':
          this.closeReviewModal();
          break;
      }
    }

    if (this.isAuthModalOpen) {
      switch (event.key) {
        case 'Escape':
          this.closeAuthModal();
          break;
      }
    }
  }

  // ✅ GETTERS
  get hasPhotos(): boolean {
    return this.photos.length > 0;
  }

  get photoCount(): number {
    return this.photos.length;
  }

  get hasMenuItems(): boolean {
    return this.menuHighlights.length > 0;
  }

  get currentPhotoUrl(): string {
    return this.heroImageUrl || '';
  }

  get hasMenuHighlights(): boolean {
    return this.menuHighlightsByCategory.length > 0;
  }

  // ✅ GETTER canBook CON DEBUG
  get canBook(): boolean {
    const user = this.authService.currentUser();
    const isCustomer = user ? this.authService.isCustomer() : false;
    const result = !!user && isCustomer;

    console.log('🔍 canBook check:', {
      hasUser: !!user,
      isCustomer: isCustomer,
      result: result
    });

    return result;
  }

  get canWriteReview(): boolean {
    const currentUser = this.authService.currentUser();
    return !!(currentUser && this.authService.isCustomer());
  }

  get reviewButtonText(): string {
    if (!this.canWriteReview) {
      return 'Accedi per Recensire';
    }
    return this.userReview ? 'Modifica la tua Recensione' : 'Scrivi una Recensione';
  }

  get reviewButtonIcon(): string {
    return this.userReview ? 'fas fa-edit' : 'fas fa-star';
  }

  get shouldShowTooltip(): boolean {
    return !this.canBook;
  }

  get tooltipMessage(): string {
    return 'Devi essere loggato per effettuare una prenotazione';
  }

  get shouldShowFixedBottom(): boolean {
    return !this.isBookingModalOpen &&
           !this.isPhotoModalOpen &&
           !this.isMenuModalOpen &&
           !this.isReviewModalOpen &&
           !this.isAuthModalOpen;
  }
}
