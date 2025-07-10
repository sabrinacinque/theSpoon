// subscription.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

export interface SubscriptionInfo {
  status: string;
  planType: string;
  monthlyPrice: number;
  startDate: string;
  endDate: string;
  daysLeft: number;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  newPlan?: string;
  plan?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // 📊 Ottieni info abbonamento del ristorante
  getSubscriptionInfo(restaurantId: number): Observable<SubscriptionInfo> {
    return this.http.get<SubscriptionInfo>(`${this.apiUrl}/subscriptions/restaurant/${restaurantId}`);
  }

  // 🔄 Cambia piano abbonamento
  changeSubscriptionPlan(restaurantId: number, newPlan: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.apiUrl}/subscriptions/restaurant/${restaurantId}/change-plan`,
      { newPlan }
    );
  }

  // 🆕 Crea nuovo abbonamento (per registrazione)
  createSubscription(restaurantId: number, plan: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.apiUrl}/subscriptions/restaurant/${restaurantId}/create`,
      { plan }
    );
  }

  // 🎨 Ottieni colore per status
  getStatusColor(status: string): string {
    switch (status) {
      case 'ATTIVO':
        return 'success';
      case 'GRATUITO':
        return 'info';
      case 'SCADUTO':
        return 'danger';
      case 'SOSPESO':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  // 🎯 Ottieni icona per status
  getStatusIcon(status: string): string {
    switch (status) {
      case 'ATTIVO':
        return '✅';
      case 'GRATUITO':
        return '🎁';
      case 'SCADUTO':
        return '❌';
      case 'SOSPESO':
        return '⏸️';
      default:
        return '❓';
    }
  }

  // 💎 Ottieni descrizione piano
  getPlanDescription(planType: string): string {
    switch (planType) {
      case 'BASIC':
        return 'Max 50 prenotazioni al mese, €1 per prenotazione extra';
      case 'GOLD':
        return 'Prenotazioni ILLIMITATE + Visibilità Premium';
      default:
        return 'Piano non definito';
    }
  }

  // 🎨 Ottieni colore piano
  getPlanColor(planType: string): string {
    switch (planType) {
      case 'BASIC':
        return 'primary';
      case 'GOLD':
        return 'warning';
      default:
        return 'secondary';
    }
  }
}
