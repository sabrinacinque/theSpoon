import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from '../../services/restaurant';
import { PhotoService } from '../../services/photo.service';
import { MenuItemService } from '../../services/menu-item.service';
import { UploadService } from '../../services/upload-service';
import { IRestaurant } from '../../models/i-restaurant';
import { IPhoto } from '../../services/photo.service';
import { IMenuItem } from '../../services/menu-item.service';
import { BookingModalComponent } from '../../modals/booking-modal/booking-modal';
import { HostListener } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface MenuHighlight {
  name: string;
  price: number;
  category?: string;
}

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, BookingModalComponent],
  templateUrl: './restaurant-detail.html',
  styleUrls: ['./restaurant-detail.css']
})
export class RestaurantDetailComponent implements OnInit {

  restaurant: IRestaurant | null = null;
  photos: IPhoto[] = [];
  menuItems: IMenuItem[] = [];
  menuHighlights: MenuHighlight[] = [];
  heroImageUrl: string = '';
  currentPhotoIndex: number = 0;

  // Menu Modal
isMenuModalOpen = false;
menuByCategory: { category: string; items: IMenuItem[] }[] = [];
menuHighlightsByCategory: { category: string; items: IMenuItem[] }[] = [];

  // Loading states
  loading = true;
  photosLoading = true;
  menuLoading = true;
  isPhotoModalOpen = false;
  // Error states
  error: string | null = null;
  photosError: string | null = null;
  menuError: string | null = null;

  restaurantId: number | null = null;

  // Booking modal
  isBookingModalOpen = false;

  // Dati mock per demo (poi verranno dal backend)
  availableDates = [
    { label: 'Oggi', date: new Date(), discount: '-20%' },
    { label: 'Domani', date: new Date(Date.now() + 86400000), discount: '-20%' },
    { label: 'Sab 06 Lug', date: new Date(Date.now() + 2 * 86400000), discount: '-20%' },
    { label: 'Dom 07 Lug', date: new Date(Date.now() + 3 * 86400000), discount: '-20%' }
  ];

  // Strengths placeholder (da implementare con recensioni future)
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.restaurantId = +params['id'];
      if (this.restaurantId) {
        this.loadRestaurantDetail();
      }
    });
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

        // Carica dati aggiuntivi (foto e menu)
        this.loadPhotos();
        this.loadMenuItems();

        console.log('🔧 DEBUG - loading:', this.loading, 'restaurant:', this.restaurant);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Errore caricamento dettaglio:', err);
        this.error = 'Errore nel caricamento del ristorante.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Carica foto del ristorante
  private loadPhotos() {
    if (!this.restaurantId) return;

    this.photosLoading = true;
    this.photosError = null;

    this.photoService.getPhotosByRestaurant(this.restaurantId).subscribe({
      next: (photos) => {
        console.log('📸 Foto caricate:', photos);
        this.photos = photos;

        // Imposta foto hero (prima foto o placeholder)
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



  // Gestione gallery foto
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

  // Getters per il template
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

  // Metodi esistenti
  goBack() {
    this.router.navigate(['/']);
  }

  toggleFavorite() {
    console.log('💖 Toggle preferito per ristorante:', this.restaurantId);
    // TODO: Implementare logica preferiti
  }

  shareRestaurant() {
    console.log('📤 Condividi ristorante:', this.restaurantId);
    // TODO: Implementare condivisione
  }


  viewAllReviews() {
    console.log('⭐ Visualizza tutte le recensioni');
    // TODO: Implementare visualizzazione recensioni
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
    return '25 €'; // fallback
  }

  // Booking modal methods
  bookTable() {
    console.log('📅 Prenota tavolo per ristorante:', this.restaurantId);
    this.isBookingModalOpen = true;
  }

  openBookingModal(selectedDate?: any) {
    console.log('📅 Apri modal prenotazione:', selectedDate ? selectedDate : 'tutte le date');

    if (selectedDate) {
      console.log('📅 Data pre-selezionata:', selectedDate.date);
    }

    this.isBookingModalOpen = true;
  }

  closeBookingModal() {
    this.isBookingModalOpen = false;
  }

  onBookingConfirmed(bookingData: any) {
    console.log('✅ Prenotazione confermata:', bookingData);
    alert('Prenotazione confermata! 🎉');
    this.closeBookingModal();
  }

  selectDate(date: any) {
    console.log('📅 Data selezionata:', date);
    this.openBookingModal(date);
  }

  // Apre il modal foto
openPhotoModal() {
  console.log('📸 Apri modal foto');
  this.isPhotoModalOpen = true;
  document.body.classList.add('modal-open');
}

// Chiude il modal foto
closePhotoModal() {
  console.log('❌ Chiudi modal foto');
  this.isPhotoModalOpen = false;
  document.body.classList.remove('modal-open');
}

// Foto successiva nel modal
nextPhotoModal() {
  this.nextPhoto();
}

// Foto precedente nel modal
previousPhotoModal() {
  this.previousPhoto();
}

// Gestisce il caricamento della foto
onPhotoLoaded() {
  console.log('✅ Foto caricata nel modal');
}

// Gestisce errori foto
onPhotoError() {
  console.error('❌ Errore caricamento foto nel modal');
}



// Aggiorna il metodo loadMenuItems()
private loadMenuItems() {
  if (!this.restaurantId) return;

  this.menuLoading = true;
  this.menuError = null;

  this.menuItemService.getMenuItemsByRestaurant(this.restaurantId).subscribe({
    next: (menuItems) => {
      console.log('🍽️ Menu items caricati:', menuItems);
      this.menuItems = menuItems;

      // Organizza per categoria
      this.organizeMenuByCategory();

      // Crea highlights (2 per categoria)
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

// Organizza menu per categoria
private organizeMenuByCategory() {
  const categoriesMap = new Map<string, IMenuItem[]>();

  this.menuItems.forEach(item => {
    const category = item.category || 'Altri piatti';
    if (!categoriesMap.has(category)) {
      categoriesMap.set(category, []);
    }
    categoriesMap.get(category)!.push(item);
  });

  // Converti in array e ordina
  this.menuByCategory = Array.from(categoriesMap.entries())
    .map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

// Crea highlights (2 per categoria)
private createMenuHighlights() {
  this.menuHighlightsByCategory = this.menuByCategory.map(categoryGroup => ({
    category: categoryGroup.category,
    items: categoryGroup.items.slice(0, 2) // Prendi solo i primi 2
  })).filter(group => group.items.length > 0);
}

// Metodi per Menu Modal
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

// Aggiorna il metodo viewFullMenu()
viewFullMenu() {
  console.log('📋 Visualizza menù completo');
  this.openMenuModal();
}

// Aggiorna il listener keyboard per includere il menu modal
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
}

// Getter per verificare se ci sono highlights
get hasMenuHighlights(): boolean {
  return this.menuHighlightsByCategory.length > 0;
}


}
