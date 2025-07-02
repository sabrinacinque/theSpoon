import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IRestaurant } from '../models/i-restaurant';
import { IPhoto } from '../models/i-photo';
import { IReview } from '../models/i-review';
import { IRatingResponse } from '../models/i-common';

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  private readonly API_URL = 'http://localhost:8080/api/restaurants';

  constructor(private http: HttpClient) { }

  // GET - Tutti i ristoranti
  getAllRestaurants(): Observable<IRestaurant[]> {
    return this.http.get<IRestaurant[]>(this.API_URL).pipe(
      map(restaurants => this.processRestaurants(restaurants))
    );
  }

  // GET - Ristorante per ID
  getRestaurantById(id: number): Observable<IRestaurant> {
    return this.http.get<IRestaurant>(`${this.API_URL}/${id}`).pipe(
      map(restaurant => this.processRestaurant(restaurant))
    );
  }

  // GET - Ristoranti per città
  getRestaurantsByCity(city: string): Observable<IRestaurant[]> {
    return this.http.get<IRestaurant[]>(`${this.API_URL}/city/${city}`).pipe(
      map(restaurants => this.processRestaurants(restaurants))
    );
  }

  // GET - Ristoranti per tipo cucina
  getRestaurantsByCuisine(cuisineType: string): Observable<IRestaurant[]> {
    return this.http.get<IRestaurant[]>(`${this.API_URL}/cuisine/${cuisineType}`).pipe(
      map(restaurants => this.processRestaurants(restaurants))
    );
  }

  // GET - Ricerca ristoranti (città + cucina)
  searchRestaurants(city?: string, cuisineType?: string): Observable<IRestaurant[]> {
    let params = new HttpParams();
    if (city) params = params.set('city', city);
    if (cuisineType) params = params.set('cuisineType', cuisineType);

    return this.http.get<IRestaurant[]>(`${this.API_URL}/search`, { params }).pipe(
      map(restaurants => this.processRestaurants(restaurants))
    );
  }

  // GET - Rating medio ristorante
  getAverageRating(id: number): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/${id}/rating`);
  }

  // GET - Rating dettagliato
  getDetailedRating(id: number): Observable<IRatingResponse> {
    return this.http.get<IRatingResponse>(`${this.API_URL}/${id}/rating`).pipe(
      map(rating => ({
        averageRating: rating.averageRating || 0,
        atmosfera: 0, // Chiamate separate
        cibo: 0,
        servizio: 0
      }))
    );
  }

  // GET - Verifica disponibilità
  checkAvailability(id: number, mealType: string, numeroPersone: number): Observable<boolean> {
    const params = new HttpParams()
      .set('mealType', mealType)
      .set('numeroPersone', numeroPersone.toString());

    return this.http.get<boolean>(`${this.API_URL}/${id}/availability`, { params });
  }

  // GET - Foto ristorante
  getRestaurantPhotos(id: number): Observable<IPhoto[]> {
    return this.http.get<IPhoto[]>(`${this.API_URL}/${id}/photos`);
  }

  // GET - Foto principale
  getMainPhoto(id: number): Observable<IPhoto> {
    return this.http.get<IPhoto>(`${this.API_URL}/${id}/photos/main`);
  }

  // GET - Recensioni ristorante
  getRestaurantReviews(id: number): Observable<IReview[]> {
    return this.http.get<IReview[]>(`${this.API_URL}/${id}/reviews`);
  }

  // GET - Recensioni più recenti
  getLatestReviews(id: number): Observable<IReview[]> {
    return this.http.get<IReview[]>(`${this.API_URL}/${id}/reviews/latest`);
  }

  // Utility methods per processare i dati
  private processRestaurants(restaurants: IRestaurant[]): IRestaurant[] {
    return restaurants.map(restaurant => this.processRestaurant(restaurant));
  }

  private processRestaurant(restaurant: IRestaurant): IRestaurant {
    // Calcola rating medio dalle recensioni
    if (restaurant.reviews && restaurant.reviews.length > 0) {
      const totalRating = restaurant.reviews.reduce((sum, review) => sum + review.overallRating, 0);
      restaurant.rating = Number((totalRating / restaurant.reviews.length).toFixed(1));
      restaurant.reviewCount = restaurant.reviews.length;
    } else {
      restaurant.rating = 0;
      restaurant.reviewCount = 0;
    }

    // Simula disponibilità (in una vera app potresti fare una chiamata separata)
    restaurant.available = Math.random() > 0.3; // 70% disponibili

    return restaurant;
  }

  // Utility per generare stelle
  generateStars(rating: number): string {
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

  // Metodi per i filtri
  filterAvailable(restaurants: IRestaurant[]): IRestaurant[] {
    return restaurants.filter(r => r.available);
  }

  filterByRating(restaurants: IRestaurant[]): IRestaurant[] {
    return restaurants.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  filterPremium(restaurants: IRestaurant[]): IRestaurant[] {
    return restaurants.filter(r => (r.rating || 0) >= 4.5);
  }
}
