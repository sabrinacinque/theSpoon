import { environment } from './../../enviroments/enviroment.development';
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
  private readonly API_URL = `${environment.apiUrl}/restaurants`;

  constructor(private http: HttpClient) { }

  // GET - Tutti i ristoranti (con DTO - available calcolato)
  getAllRestaurants(): Observable<IRestaurant[]> {
    return this.http.get<IRestaurant[]>(this.API_URL);
  }

  // GET - Ristorante per ID (con DTO)
  getRestaurantById(id: number): Observable<IRestaurant> {
    return this.http.get<IRestaurant>(`${this.API_URL}/${id}`);
  }

  // GET - Ristoranti RAW (senza DTO, per uso interno)
  getAllRestaurantsRaw(): Observable<IRestaurant[]> {
    return this.http.get<IRestaurant[]>(`${this.API_URL}/raw`);
  }

  // GET - Ristoranti per città
  getRestaurantsByCity(city: string): Observable<IRestaurant[]> {
    return this.http.get<IRestaurant[]>(`${this.API_URL}/city/${city}`);
  }

  // GET - Ristoranti per tipo cucina
  getRestaurantsByCuisine(cuisineType: string): Observable<IRestaurant[]> {
    return this.http.get<IRestaurant[]>(`${this.API_URL}/cuisine/${cuisineType}`);
  }

  // GET - Ricerca ristoranti (città + cucina)
  searchRestaurants(city?: string, cuisineType?: string): Observable<IRestaurant[]> {
    let params = new HttpParams();
    if (city) params = params.set('city', city);
    if (cuisineType) params = params.set('cuisineType', cuisineType);

    return this.http.get<IRestaurant[]>(`${this.API_URL}/search`, { params });
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
        atmosfera: 0, // Chiamate separate se necessario
        cibo: 0,
        servizio: 0
      }))
    );
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

  // Metodi per i filtri - AGGIORNATI
  filterOpen(restaurants: IRestaurant[]): IRestaurant[] {
    return restaurants.filter(r => r.available === true);
  }

  filterClosed(restaurants: IRestaurant[]): IRestaurant[] {
    return restaurants.filter(r => r.available === false);
  }

  filterByRating(restaurants: IRestaurant[]): IRestaurant[] {
    return restaurants.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  filterPremium(restaurants: IRestaurant[]): IRestaurant[] {
    return restaurants.filter(r => (r.rating || 0) >= 4.5);
  }

// Aggiungi nel RestaurantService
getRestaurantByBusinessId(businessId: number): Observable<IRestaurant> {
  return this.http.get<IRestaurant>(`${this.API_URL}/business/${businessId}`);
}

updateRestaurantField(restaurantId: number, fieldName: string, fieldValue: string, businessId: number): Observable<IRestaurant> {
  const params = new HttpParams()
    .set('fieldName', fieldName)
    .set('fieldValue', fieldValue)
    .set('businessId', businessId.toString());
  return this.http.patch<IRestaurant>(`${this.API_URL}/${restaurantId}/field`, null, { params });
}
}
