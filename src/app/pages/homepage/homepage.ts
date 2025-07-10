import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RestaurantService } from '../../services/restaurant';
import { PhotoService } from '../../services/photo.service';
import { UploadService } from '../../services/upload-service';
import { IRestaurant } from '../../models/i-restaurant';
import { IPhoto } from '../../models/i-photo';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.css']
})
export class HomepageComponent implements OnInit {

  // Data
  restaurants: IRestaurant[] = [];
  filteredRestaurants: IRestaurant[] = [];
  restaurantPhotos: { [key: number]: string } = {}; // Cache foto principale per ogni ristorante
  photoLoadingStates: { [key: number]: boolean } = {}; // Stato loading per ogni foto

  // States
  loading = false;
  error: string | null = null;

  // Search & Filters
  searchFilters = {
    city: '',
    cuisine: ''
  };

  // ✅ AUTOCOMPLETE PROPRIETÀ
  availableCities: string[] = [];
  filteredCities: string[] = [];
  showCityDropdown = false;
  selectedCityIndex = -1;

  // Categories
  categories = [
    { name: 'Pizza', icon: '🍕' },
    { name: 'Cinese', icon: '🥢' },
    { name: 'Italiana', icon: '🍝' },
    { name: 'Pub&Steakhouse', icon: '🥩' },
    { name: 'Vegetariana', icon: '🥗' }
  ];

  // Quick Filters
  quickFilters = [
    { name: 'Tutti', active: true },
    { name: 'Aperti', active: false },
    { name: 'Migliori Recensioni', active: false },
    { name: 'Nuovi', active: false },
    { name: 'Premium', active: false }
  ];

  constructor(
    private restaurantService: RestaurantService,
    private photoService: PhotoService,
    private uploadService: UploadService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit() {
    console.log('🏠 Homepage inizializzata');
    this.loadItalianCities();
    this.loadRestaurants();
    this.initAnimations();
  }

  // ✅ CARICA CITTÀ ITALIANE DA JSON
  private loadItalianCities() {
    console.log('📍 Caricamento città italiane...');

    this.http.get<string[]>('assets/data/italian-cities.json').subscribe({
      next: (cities) => {
        console.log('✅ Città caricate:', cities.length);
        this.availableCities = cities.sort();
        this.filteredCities = [];
      },
      error: (err) => {
        console.error('❌ Errore caricamento città:', err);
        // Fallback con città principali
        this.availableCities = [
          'Milano', 'Roma', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze',
          'Bari', 'Catania', 'Venezia', 'Verona', 'Messina', 'Padova', 'Trieste', 'Taranto',
          'Brescia', 'Parma', 'Reggio Emilia', 'Modena', 'Prato', 'Cagliari', 'Livorno',
          'Perugia', 'Ravenna', 'Rimini', 'Salerno', 'Ferrara', 'Sassari', 'Monza',
          'Bergamo', 'Trento', 'Forlì', 'Vicenza', 'Terni', 'Bolzano', 'Novara',
          'Piacenza', 'Ancona', 'Andria', 'Arezzo', 'Udine', 'Cesena', 'Lecce',
          'Pesaro', 'Barletta', 'Alessandria', 'La Spezia', 'Pistoia', 'Caserta'
        ].sort();
        this.filteredCities = [];
      }
    });
  }

  // ✅ AUTOCOMPLETE METODI
  onCityInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.toLowerCase().trim();

    console.log('🔍 Ricerca città:', value);

    if (value.length === 0) {
      this.filteredCities = [];
      this.showCityDropdown = false;
      this.selectedCityIndex = -1;
      return;
    }

    // Filtra città che contengono la stringa digitata
    this.filteredCities = this.availableCities
      .filter(city => city.toLowerCase().includes(value))
      .slice(0, 10); // Limita a 10 risultati

    this.showCityDropdown = this.filteredCities.length > 0;
    this.selectedCityIndex = -1;

    console.log('📋 Città filtrate:', this.filteredCities.length);
  }

  onCityFocus() {
    console.log('👁️ Focus su input città');
    if (this.searchFilters.city.length > 0) {
      this.onCityInput({ target: { value: this.searchFilters.city } } as any);
    }
  }

  onCityBlur() {
    // Ritarda la chiusura per permettere il click sui risultati
    setTimeout(() => {
      console.log('😴 Blur input città');
      this.showCityDropdown = false;
      this.selectedCityIndex = -1;
    }, 200);
  }

  selectCity(city: string) {
    console.log('🎯 Città selezionata:', city);
    this.searchFilters.city = city;
    this.showCityDropdown = false;
    this.selectedCityIndex = -1;
    this.filteredCities = [];
  }

  // ✅ NAVIGAZIONE TASTIERA
  @HostListener('keydown', ['$event'])
  handleKeyboardNavigation(event: KeyboardEvent) {
    if (!this.showCityDropdown || this.filteredCities.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedCityIndex = Math.min(
          this.selectedCityIndex + 1,
          this.filteredCities.length - 1
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedCityIndex = Math.max(this.selectedCityIndex - 1, -1);
        break;

      case 'Enter':
        event.preventDefault();
        if (this.selectedCityIndex >= 0) {
          this.selectCity(this.filteredCities[this.selectedCityIndex]);
        }
        break;

      case 'Escape':
        this.showCityDropdown = false;
        this.selectedCityIndex = -1;
        break;
    }
  }

  // Animations
  private initAnimations() {
    setTimeout(() => {
      const elements = document.querySelectorAll('.animate-on-load');
      elements.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('animate__animated', 'animate__fadeInUp');
        }, index * 200);
      });
    }, 100);
  }

  // Data Loading
  loadRestaurants() {
    console.log('📊 Caricamento ristoranti...');
    this.loading = true;
    this.error = null;

    this.restaurantService.getAllRestaurants().subscribe({
      next: (data) => {
        console.log('✅ Ristoranti caricati:', data);
        this.restaurants = data;
        this.filteredRestaurants = [...data];
        this.loading = false;

        // Carica le foto principali per ogni ristorante
        this.loadRestaurantPhotos();

        this.cdr.detectChanges();
        console.log('🔄 Loading terminato + Change Detection forzato');
      },
      error: (err) => {
        console.error('❌ Errore caricamento ristoranti:', err);
        this.error = 'Errore nel caricamento dei ristoranti. Riprova più tardi.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Carica foto principali per tutti i ristoranti
  private loadRestaurantPhotos() {
    console.log('📸 Caricamento foto ristoranti...');

    // Crea array di observable per le foto
    const photoObservables = this.restaurants.map(restaurant =>
      this.photoService.getPhotosByRestaurant(restaurant.id).pipe(
        map(photos => ({ restaurantId: restaurant.id, photos })),
        catchError(err => {
          console.warn(`⚠️ Errore caricamento foto per ristorante ${restaurant.id}:`, err);
          return of({ restaurantId: restaurant.id, photos: [] });
        })
      )
    );

    // Esegui tutte le chiamate in parallelo
    forkJoin(photoObservables).subscribe({
      next: (results) => {
        console.log('✅ Foto caricate:', results);

        results.forEach(result => {
          if (result.photos && result.photos.length > 0) {
            // Prendi la prima foto come principale
            const mainPhoto = result.photos[0];
            this.restaurantPhotos[result.restaurantId] = this.uploadService.getImageUrl(mainPhoto.fileName);
          }
        });

        this.cdr.detectChanges();
        console.log('📸 Foto integrate nelle card');
      },
      error: (err) => {
        console.error('❌ Errore caricamento foto:', err);
      }
    });
  }

  // Metodo per ottenere l'URL della foto principale
  getRestaurantMainPhoto(restaurantId: number): string | null {
    return this.restaurantPhotos[restaurantId] || null;
  }

  // Metodo per verificare se la foto è in caricamento
  isPhotoLoading(restaurantId: number): boolean {
    return this.photoLoadingStates[restaurantId] || false;
  }

  // Search & Filters
  searchRestaurants() {
    console.log('🔍 Ricerca con filtri:', this.searchFilters);

    this.filteredRestaurants = this.restaurants.filter(restaurant => {
      const cityMatch = !this.searchFilters.city ||
                       restaurant.city?.toLowerCase().includes(this.searchFilters.city.toLowerCase());

      const cuisineMatch = !this.searchFilters.cuisine ||
                          restaurant.cuisineType?.toLowerCase().includes(this.searchFilters.cuisine.toLowerCase());

      return cityMatch && cuisineMatch;
    });

    // Scroll to results with smooth animation
    setTimeout(() => {
      const resultsElement = document.getElementById('restaurantsGrid');
      if (resultsElement) {
        resultsElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  }

  filterByCuisine(cuisineName: string) {
    console.log('🍽️ Filtro per cucina:', cuisineName);
    this.searchFilters.cuisine = cuisineName;
    this.searchRestaurants();
  }

  toggleFilter(filter: any) {
    console.log('🔧 Toggle filtro:', filter.name);

    // Reset tutti i filtri
    this.quickFilters.forEach(f => f.active = false);
    filter.active = true;

    // Applica filtro
    switch(filter.name) {
      case 'Tutti':
        this.filteredRestaurants = [...this.restaurants];
        this.resetSearchFilters();
        break;

      case 'Aperti':
        this.filteredRestaurants = this.restaurants.filter(r => r.available === true);
        break;

      case 'Migliori Recensioni':
        this.filteredRestaurants = this.restaurants
          .filter(r => (r.rating || 0) >= 4.0)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;

      case 'Nuovi':
        this.filteredRestaurants = [...this.restaurants]
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(6, this.restaurants.length));
        break;

      case 'Premium':
        this.filteredRestaurants = this.restaurants
          .filter(r => (r.rating || 0) >= 4.2)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    // Scroll to results
    setTimeout(() => {
      const resultsElement = document.getElementById('restaurantsGrid');
      if (resultsElement) {
        resultsElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  }

  private resetSearchFilters() {
    this.searchFilters = {
      city: '',
      cuisine: ''
    };
  }

  // Utility Methods
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

  viewRestaurant(restaurantId: number) {
    console.log('👁️ Visualizza ristorante:', restaurantId);
    this.router.navigate(['/restaurant', restaurantId]);
  }

  onRestaurantCardClick(event: Event, restaurant: IRestaurant) {
    event.preventDefault();
    console.log('🎯 Card cliccata:', restaurant);
    this.viewRestaurant(restaurant.id);
  }

  // Gestione errori immagini
  onImageError(event: any, restaurantId: number) {
    console.log('❌ Errore caricamento immagine per ristorante:', restaurantId);
    // Rimuovi l'immagine dalla cache per mostrare il placeholder
    delete this.restaurantPhotos[restaurantId];
    this.cdr.detectChanges();
  }

  refreshRestaurants() {
    console.log('🔄 Refresh ristoranti...');
    this.resetSearchFilters();
    this.resetFilters();
    this.loadRestaurants();
  }

  private resetFilters() {
    this.quickFilters.forEach(f => f.active = false);
    this.quickFilters[0].active = true;
  }

  onSearchFocus() {
    console.log('🔍 Focus su ricerca');
  }

  onCategoryHover(category: any) {
    console.log('👆 Hover su categoria:', category.name);
  }

  onScroll(event: any) {
    // console.log('📜 Scroll event:', event);
  }
}
