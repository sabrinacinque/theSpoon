import { Component, OnInit, HostBinding, Renderer2, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantService } from '../../services/restaurant';
import { IRestaurant } from '../../models/i-restaurant';

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

  // Theme Management
  @HostBinding('class.light-theme')
  get isLightTheme() {
    return !this.isDarkTheme;
  }

  isDarkTheme = true;

  // Data
  restaurants: IRestaurant[] = [];
  filteredRestaurants: IRestaurant[] = [];

  // States
  loading = false;
  error: string | null = null;

  // Search & Filters
  searchFilters = {
    city: '',
    cuisine: ''
  };

  // Categories
  categories = [
    { name: 'Napoletana', icon: '🍕' },
    { name: 'Lombarda', icon: '🧀' },
    { name: 'Romana', icon: '🍝' },
    { name: 'Toscana', icon: '🥩' },
    { name: 'Siciliana', icon: '🍋' }
  ];

  // Quick Filters
  quickFilters = [
    { name: 'Tutti', active: true },
    { name: 'Disponibili Ora', active: false },
    { name: 'Migliori Recensioni', active: false },
    { name: 'Nuovi', active: false },
    { name: 'Premium', active: false }
  ];

  constructor(
    private restaurantService: RestaurantService,
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    // Leggi tema salvato
    const savedTheme = localStorage.getItem('theme');
    this.isDarkTheme = savedTheme ? savedTheme === 'dark' : true;
    this.applyTheme();
  }

  ngOnInit() {
    this.loadRestaurants();
    this.initAnimations();
  }

  // Theme Management
  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
  }

  private applyTheme() {
    const theme = this.isDarkTheme ? 'dark' : 'light';
    this.renderer.setAttribute(this.document.documentElement, 'data-bs-theme', theme);
    this.renderer.setAttribute(this.document.body, 'data-theme', theme);
  }

  // Animations
  private initAnimations() {
    // Trigger animations on load
    setTimeout(() => {
      const elements = this.document.querySelectorAll('.animate-on-load');
      elements.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('animate__animated', 'animate__fadeInUp');
        }, index * 200);
      });
    }, 100);
  }

  // Data Loading
  loadRestaurants() {
    this.loading = true;
    this.error = null;

    this.restaurantService.getAllRestaurants().subscribe({
      next: (data) => {
        console.log('✅ Ristoranti caricati:', data);
        this.restaurants = data;
        this.filteredRestaurants = [...data];
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Errore caricamento ristoranti:', err);
        this.error = 'Errore nel caricamento dei ristoranti. Riprova più tardi.';
        this.loading = false;
      }
    });
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

    // Attiva il filtro selezionato
    filter.active = true;

    // Applica filtro
    switch(filter.name) {
      case 'Tutti':
        this.filteredRestaurants = [...this.restaurants];
        this.resetSearchFilters();
        break;

      case 'Disponibili Ora':
        this.filteredRestaurants = this.restaurants.filter(r => r.available);
        break;

      case 'Migliori Recensioni':
        this.filteredRestaurants = this.restaurants
          .filter(r => (r.rating || 0) >= 4.0)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;

      case 'Nuovi':
        // Simula "nuovi" - ordinamento casuale per demo
        this.filteredRestaurants = [...this.restaurants]
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(6, this.restaurants.length));
        break;

      case 'Premium':
        // Simula "premium" - rating alto
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

    return stars || '⭐'; // Fallback
  }

  viewRestaurant(restaurantId: number) {
    console.log('👁️ Visualizza ristorante:', restaurantId);

    // TODO: Implementare navigazione quando avremo la pagina dettaglio
    // this.router.navigate(['/restaurant', restaurantId]);

    // Per ora aggiungi feedback visivo
    const restaurantName = this.restaurants.find(r => r.id === restaurantId)?.name;
    if (restaurantName) {
      console.log(`🎯 Cliccato su: ${restaurantName}`);

      // Feedback temporaneo - potremmo mostrare un toast
      // this.showToast(`Apertura dettagli di ${restaurantName}...`);
    }
  }

  // Metodi di utilità per debug e sviluppo
  onRestaurantCardClick(event: Event, restaurant: IRestaurant) {
    event.preventDefault();
    console.log('🎯 Card cliccata:', restaurant);
    this.viewRestaurant(restaurant.id);
  }

  // Metodo per gestire errori di caricamento immagini
  onImageError(event: any) {
    console.log('❌ Errore caricamento immagine:', event);
    // Potremo sostituire con immagine placeholder
  }

  // Metodo per refresh completo
  refreshRestaurants() {
    console.log('🔄 Refresh ristoranti...');
    this.resetSearchFilters();
    this.resetFilters();
    this.loadRestaurants();
  }

  private resetFilters() {
    this.quickFilters.forEach(f => f.active = false);
    this.quickFilters[0].active = true; // "Tutti" attivo
  }

  // Metodi per gestione responsive e UX
  onSearchFocus() {
    console.log('🔍 Focus su ricerca');
    // Potremo aggiungere effetti o analytics
  }

  onCategoryHover(category: any) {
    console.log('👆 Hover su categoria:', category.name);
    // Potremo aggiungere preview o effetti
  }

  // Gestione scroll e lazy loading (per futuro)
  onScroll(event: any) {
    // console.log('📜 Scroll event:', event);
    // TODO: Implementare lazy loading quando avremo più ristoranti
  }
}
