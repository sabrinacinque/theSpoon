import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    { name: 'Aperti', active: false },
    { name: 'Migliori Recensioni', active: false },
    { name: 'Nuovi', active: false },
    { name: 'Premium', active: false }
  ];

  constructor(
    private restaurantService: RestaurantService,
    private router: Router,
    private cdr: ChangeDetectorRef  // ← AGGIUNGI QUESTO
  ) {
    // ✅ RIMOSSO: Tutta la gestione tema - usa solo ThemeService!
  }

  ngOnInit() {
    console.log('🏠 Homepage inizializzata');
    this.loadRestaurants();
    this.initAnimations();
  }

  // ✅ RIMOSSO: toggleTheme() e applyTheme() - usa navbar!

  // Animations
  private initAnimations() {
    // Trigger animations on load
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

        // 🔥 FORZA CHANGE DETECTION
        this.cdr.detectChanges();

        console.log('🔄 Loading terminato + Change Detection forzato');
      },
      error: (err) => {
        console.error('❌ Errore caricamento ristoranti:', err);
        this.error = 'Errore nel caricamento dei ristoranti. Riprova più tardi.';
        this.loading = false;

        // 🔥 FORZA CHANGE DETECTION ANCHE IN CASO DI ERRORE
        this.cdr.detectChanges();
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

  onImageError(event: any) {
    console.log('❌ Errore caricamento immagine:', event);
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
