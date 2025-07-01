import { Component, OnInit, HostBinding } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Restaurant {
  id: number;
  name: string;
  cuisineType: string;
  city: string;
  address: string;
  description: string;
  rating: number;
  reviewCount: number;
  available: boolean;
}

interface Category {
  name: string;
  icon: string;
}

interface QuickFilter {
  label: string;
  value: string;
  active: boolean;
}

interface SearchFilters {
  city: string;
  cuisine: string;
}

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class HomepageComponent implements OnInit {

  @HostBinding('class.light-theme')
  get isLightTheme() { return !this.isDarkTheme; }

  isDarkTheme = true; // Default dark theme

  searchFilters: SearchFilters = {
    city: '',
    cuisine: ''
  };

  categories: Category[] = [
    { name: 'Napoletana', icon: '🍕' },
    { name: 'Romana', icon: '🍝' },
    { name: 'Toscana', icon: '🥩' },
    { name: 'Lombarda', icon: '🧀' },
    { name: 'Siciliana', icon: '🍤' },
    { name: 'Ligure', icon: '🌿' }
  ];

  quickFilters: QuickFilter[] = [
    { label: 'Tutti', value: 'all', active: true },
    { label: 'Disponibili Ora', value: 'disponibili', active: false },
    { label: 'Migliori Recensioni', value: 'rating', active: false },
    { label: 'Nuovi', value: 'nuovi', active: false },
    { label: 'Premium', value: 'premium', active: false }
  ];

  restaurants: Restaurant[] = [
    {
      id: 1,
      name: "Trattoria Nonna Rosa",
      cuisineType: "Napoletana",
      city: "Napoli",
      address: "Via dei Tribunali 45",
      description: "Autentica cucina napoletana con pizza fritta e ragù della nonna. Nel cuore del centro storico.",
      rating: 4.5,
      reviewCount: 127,
      available: true
    },
    {
      id: 2,
      name: "Osteria del Borgo",
      cuisineType: "Lombarda",
      city: "Milano",
      address: "Corso Buenos Aires 87",
      description: "Cucina lombarda tradizionale con risotto alla milanese e cotoletta. Ambiente elegante.",
      rating: 4.2,
      reviewCount: 89,
      available: true
    },
    {
      id: 3,
      name: "Da Checco al Pantheon",
      cuisineType: "Romana",
      city: "Roma",
      address: "Via del Pantheon 15",
      description: "Cucina romana autentica: carbonara, amatriciana e cacio e pepe. Vista mozzafiato.",
      rating: 4.7,
      reviewCount: 203,
      available: false
    },
    {
      id: 4,
      name: "Trattoria del Ponte Vecchio",
      cuisineType: "Toscana",
      city: "Firenze",
      address: "Via Por Santa Maria 8",
      description: "Bistecca alla fiorentina e ribollita toscana. Terrazza con vista su Ponte Vecchio.",
      rating: 4.3,
      reviewCount: 156,
      available: true
    },
    {
      id: 5,
      name: "Taverna Siciliana",
      cuisineType: "Siciliana",
      city: "Palermo",
      address: "Via Vittorio Emanuele 203",
      description: "Arancini, caponata e cannoli freschi. Tradizione siciliana autentica.",
      rating: 4.6,
      reviewCount: 98,
      available: true
    }
  ];

  filteredRestaurants: Restaurant[] = [];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.filteredRestaurants = [...this.restaurants];
    this.loadTheme();
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.saveTheme();
  }

  /**
   * Save theme preference to localStorage
   */
  private saveTheme(): void {
    localStorage.setItem('thespoon-theme', this.isDarkTheme ? 'dark' : 'light');
  }

  /**
   * Load theme preference from localStorage
   */
  private loadTheme(): void {
    const savedTheme = localStorage.getItem('thespoon-theme');
    if (savedTheme) {
      this.isDarkTheme = savedTheme === 'dark';
    }
  }

  /**
   * Navigate to home page
   */
  goToHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Navigate to login page
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Search restaurants based on filters
   */
  searchRestaurants(): void {
    let filtered = [...this.restaurants];

    if (this.searchFilters.city) {
      filtered = filtered.filter(r => r.city === this.searchFilters.city);
    }

    if (this.searchFilters.cuisine) {
      filtered = filtered.filter(r => r.cuisineType === this.searchFilters.cuisine);
    }

    this.filteredRestaurants = filtered;
    this.resetQuickFilters();
  }

  /**
   * Filter restaurants by cuisine type
   */
  filterByCuisine(cuisine: string): void {
    this.filteredRestaurants = this.restaurants.filter(r => r.cuisineType === cuisine);
    this.searchFilters.cuisine = cuisine;
    this.resetQuickFilters();
  }

  /**
   * Toggle quick filter
   */
  toggleFilter(selectedFilter: QuickFilter): void {
    // Reset all filters
    this.quickFilters.forEach(f => f.active = false);
    selectedFilter.active = true;

    let filtered = [...this.restaurants];

    switch(selectedFilter.value) {
      case 'disponibili':
        filtered = this.restaurants.filter(r => r.available);
        break;
      case 'rating':
        filtered = this.restaurants.sort((a, b) => b.rating - a.rating);
        break;
      case 'nuovi':
        filtered = [...this.restaurants].reverse();
        break;
      case 'premium':
        filtered = this.restaurants.filter(r => r.rating >= 4.5);
        break;
      case 'all':
      default:
        filtered = [...this.restaurants];
        break;
    }

    this.filteredRestaurants = filtered;
  }

  /**
   * Reset quick filters to 'all'
   */
  private resetQuickFilters(): void {
    this.quickFilters.forEach(f => f.active = f.value === 'all');
  }

  /**
   * Generate star rating string
   */
  getStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
      stars += '⭐';
    }
    if (hasHalfStar) {
      stars += '⭐';
    }

    return stars;
  }

  /**
   * View restaurant details
   */
  viewRestaurant(id: number): void {
    console.log('Viewing restaurant with ID:', id);
    this.router.navigate(['/restaurant', id]);
  }
}
