// services/review.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// 📋 INTERFACES
export interface IReview {
  id: number;
  ratingGeneral: number;
  ratingAtmosfera: number;
  ratingCibo: number;
  ratingServizio: number;
  comment?: string;
  createdAt: string;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  restaurant: {
    id: number;
    name: string;
    city: string;
  };
}

export interface IReviewStats {
  totalReviews: number;
  averageGeneral: number;
  averageAtmosfera: number;
  averageCibo: number;
  averageServizio: number;
}

export interface ICreateReviewRequest {
  customerId: number;
  restaurantId: number;
  ratingGeneral: number;
  ratingAtmosfera: number;
  ratingCibo: number;
  ratingServizio: number;
  comment?: string;
}

export interface IUpdateReviewRequest {
  ratingGeneral: number;
  ratingAtmosfera: number;
  ratingCibo: number;
  ratingServizio: number;
  comment?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private API_URL = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  // 🔧 Headers privati con JWT
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('thespoon_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  // ✅ CREATE - Crea nuova review
  createReview(reviewData: ICreateReviewRequest): Observable<IReview> {
    console.log('📝 ReviewService: Creazione review', reviewData);

    return this.http.post<IReview>(`${this.API_URL}/create`, reviewData, {
      headers: this.getHeaders()
    });
  }

  // ✅ READ - Ottieni review per ID
  getReviewById(reviewId: number): Observable<IReview> {
    console.log('🔍 ReviewService: Caricamento review ID', reviewId);

    return this.http.get<IReview>(`${this.API_URL}/${reviewId}`, {
      headers: this.getHeaders()
    });
  }

  // ✅ READ - Ottieni tutte le review di un ristorante
  getReviewsByRestaurant(restaurantId: number): Observable<IReview[]> {
    console.log('🏪 ReviewService: Caricamento review ristorante', restaurantId);

    return this.http.get<IReview[]>(`${this.API_URL}/restaurant/${restaurantId}`, {
      headers: this.getHeaders()
    });
  }

  // ✅ READ - Ottieni tutte le review di un customer
  getReviewsByCustomer(customerId: number): Observable<IReview[]> {
    console.log('👤 ReviewService: Caricamento review customer', customerId);

    return this.http.get<IReview[]>(`${this.API_URL}/customer/${customerId}`, {
      headers: this.getHeaders()
    });
  }

  // ✅ READ - Verifica se customer ha già recensito il ristorante
  hasCustomerReviewedRestaurant(customerId: number, restaurantId: number): Observable<boolean> {
    console.log('❓ ReviewService: Verifica review esistente', { customerId, restaurantId });

    const params = new HttpParams()
      .set('customerId', customerId.toString())
      .set('restaurantId', restaurantId.toString());

    return this.http.get<boolean>(`${this.API_URL}/check`, {
      headers: this.getHeaders(),
      params
    });
  }

  // ✅ READ - Ottieni review specifica di un customer per un ristorante
  getCustomerReviewForRestaurant(customerId: number, restaurantId: number): Observable<IReview> {
    console.log('🎯 ReviewService: Caricamento review specifica', { customerId, restaurantId });

    return this.http.get<IReview>(`${this.API_URL}/customer/${customerId}/restaurant/${restaurantId}`, {
      headers: this.getHeaders()
    });
  }

  // ✅ UPDATE - Aggiorna review esistente
  updateReview(reviewId: number, customerId: number, reviewData: IUpdateReviewRequest): Observable<IReview> {
    console.log('✏️ ReviewService: Aggiornamento review', { reviewId, customerId, reviewData });

    const params = new HttpParams().set('customerId', customerId.toString());

    return this.http.put<IReview>(`${this.API_URL}/${reviewId}`, reviewData, {
      headers: this.getHeaders(),
      params
    });
  }

  // ✅ DELETE - Elimina review
  deleteReview(reviewId: number, customerId: number): Observable<string> {
    console.log('🗑️ ReviewService: Eliminazione review', { reviewId, customerId });

    const params = new HttpParams().set('customerId', customerId.toString());

    return this.http.delete<string>(`${this.API_URL}/${reviewId}`, {
      headers: this.getHeaders(),
      params
    });
  }

  // ✅ STATISTICS - Ottieni statistiche review per ristorante
  getRestaurantReviewStats(restaurantId: number): Observable<IReviewStats> {
    console.log('📊 ReviewService: Caricamento statistiche', restaurantId);

    return this.http.get<IReviewStats>(`${this.API_URL}/restaurant/${restaurantId}/stats`, {
      headers: this.getHeaders()
    });
  }

  // ✅ BUSINESS - Ottieni review recenti per dashboard business
  getRecentReviewsForBusiness(businessId: number, limit: number = 10): Observable<IReview[]> {
    console.log('💼 ReviewService: Caricamento review recenti business', { businessId, limit });

    const params = new HttpParams().set('limit', limit.toString());

    return this.http.get<IReview[]>(`${this.API_URL}/business/${businessId}/recent`, {
      headers: this.getHeaders(),
      params
    });
  }

  // ✅ UTILITY - Conteggio review per ristorante
  getReviewCountByRestaurant(restaurantId: number): Observable<number> {
    console.log('🔢 ReviewService: Conteggio review ristorante', restaurantId);

    return this.http.get<number>(`${this.API_URL}/restaurant/${restaurantId}/count`, {
      headers: this.getHeaders()
    });
  }

  // ✅ UTILITY - Conteggio review per customer
  getReviewCountByCustomer(customerId: number): Observable<number> {
    console.log('🔢 ReviewService: Conteggio review customer', customerId);

    return this.http.get<number>(`${this.API_URL}/customer/${customerId}/count`, {
      headers: this.getHeaders()
    });
  }

  // ✅ SEARCH - Review per rating minimo
  getReviewsByMinRating(restaurantId: number, minRating: number = 1): Observable<IReview[]> {
    console.log('⭐ ReviewService: Ricerca per rating minimo', { restaurantId, minRating });

    const params = new HttpParams()
      .set('restaurantId', restaurantId.toString())
      .set('minRating', minRating.toString());

    return this.http.get<IReview[]>(`${this.API_URL}/search/rating`, {
      headers: this.getHeaders(),
      params
    });
  }

  // ✅ SEARCH - Review con commenti
  getReviewsWithComments(restaurantId: number): Observable<IReview[]> {
    console.log('💬 ReviewService: Caricamento review con commenti', restaurantId);

    return this.http.get<IReview[]>(`${this.API_URL}/restaurant/${restaurantId}/with-comments`, {
      headers: this.getHeaders()
    });
  }

  // 🎨 UTILITY - Formatta rating come stelle
  formatRatingAsStars(rating: number): string {
    if (!rating || rating === 0) return '☆☆☆☆☆☆☆☆☆☆';

    const fullStars = Math.floor(rating);
    const emptyStars = 10 - fullStars;

    return '⭐'.repeat(fullStars) + '☆'.repeat(emptyStars);
  }

  // 🎨 UTILITY - Converte rating 1-10 in 1-5 stelle (per display)
  convertTo5StarRating(rating: number): number {
    return Math.round((rating / 10) * 5 * 10) / 10; // Arrotonda a 1 decimale
  }

  // 🎨 UTILITY - Formatta data review
  formatReviewDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Oggi';
    if (diffInDays === 1) return 'Ieri';
    if (diffInDays < 7) return `${diffInDays} giorni fa`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} settimane fa`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} mesi fa`;

    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // 🎨 UTILITY - Ottieni colore per rating
  getRatingColor(rating: number): string {
    if (rating >= 8) return '#22c55e'; // verde
    if (rating >= 6) return '#f59e0b'; // arancione
    if (rating >= 4) return '#ef4444'; // rosso
    return '#6b7280'; // grigio
  }

  // 🎨 UTILITY - Ottieni emoji per rating
  getRatingEmoji(rating: number): string {
    if (rating >= 9) return '🤩';
    if (rating >= 8) return '😍';
    if (rating >= 7) return '😊';
    if (rating >= 6) return '🙂';
    if (rating >= 5) return '😐';
    if (rating >= 4) return '😕';
    if (rating >= 3) return '☹️';
    return '😞';
  }
}
