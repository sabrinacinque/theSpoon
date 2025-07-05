// subscription-section.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService, SubscriptionInfo } from '../../../../services/subscription-service';
import { RestaurantService } from '../../../../services/restaurant';
import { AuthService } from '../../../../services/auth';

@Component({
  selector: 'app-subscription-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-section.html',
  styleUrls: ['./subscription-section.css']
})
export class SubscriptionSection implements OnInit {

  // 📊 Dati abbonamento
  subscriptionInfo: SubscriptionInfo | null = null;
  loading: boolean = false;
  error: string | null = null;
  isChanging: boolean = false;

  // 🎨 Alert personalizzato
  showAlert: boolean = false;
  alertMessage: string = '';

  // 🏢 ID ristorante
  restaurantId: number | null = null;

  constructor(
    private subscriptionService: SubscriptionService,
    private restaurantService: RestaurantService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRestaurantId();
  }

  // 🏢 Carica ID ristorante del business loggato
  private loadRestaurantId(): void {
    const currentUser = this.authService.currentUser();

    if (!currentUser || !this.authService.isBusiness()) {
      this.error = 'Errore: utente non autorizzato';
      return;
    }

    // 🔥 USA IL BUSINESS ID DELL'UTENTE LOGGATO
    const businessId = currentUser.userId;
    console.log('👤 Business ID dell\'utente loggato:', businessId);

    if (businessId) {
      this.restaurantService.getRestaurantByBusinessId(businessId).subscribe({
        next: (restaurant) => {
          this.restaurantId = restaurant.id;
          console.log('🏪 Restaurant ID ottenuto dinamicamente:', this.restaurantId);
          this.loadSubscriptionInfo();
        },
        error: (error) => {
          console.error('❌ Errore nel caricamento ristorante:', error);
          this.error = 'Impossibile caricare i dati del ristorante';
        }
      });
    } else {
      this.error = 'Business ID non trovato';
    }
  }

  // 📊 Carica info abbonamento
 loadSubscriptionInfo(): void {
  if (!this.restaurantId) return;

  console.log('🔍 Caricando abbonamento per restaurant ID:', this.restaurantId);

  this.loading = true;
  this.error = null;

  this.subscriptionService.getSubscriptionInfo(this.restaurantId).subscribe({
    next: (info) => {
      console.log('✅ Abbonamento ricevuto:', info);
      this.subscriptionInfo = info;
      this.loading = false;
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('❌ Errore caricamento abbonamento:', error);
      this.error = 'Impossibile caricare i dati dell\'abbonamento';
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

  // 🔄 Cambia piano abbonamento
  changePlan(newPlan: string): void {
    if (!this.restaurantId || this.isChanging) return;

    this.isChanging = true;

    this.subscriptionService.changeSubscriptionPlan(this.restaurantId, newPlan).subscribe({
      next: (response) => {
        if (response.success) {
          this.alertMessage = response.message;
          this.showAlert = true;

          // Ricarica info abbonamento
          setTimeout(() => {
            this.loadSubscriptionInfo();
            this.isChanging = false;
          }, 1000);
        } else {
          this.error = response.message;
          this.isChanging = false;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Errore nel cambio piano:', error);
        this.error = 'Errore nel cambio del piano abbonamento';
        this.isChanging = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 🎨 Ottieni colore status
  getStatusColor(status: string): string {
    return this.subscriptionService.getStatusColor(status);
  }

  // 🎯 Ottieni icona status
  getStatusIcon(status: string): string {
    return this.subscriptionService.getStatusIcon(status);
  }

  // 💎 Ottieni descrizione piano
  getPlanDescription(planType: string): string {
    return this.subscriptionService.getPlanDescription(planType);
  }

  // 📅 Formatta data
  formatDate(dateString: string): string {
    if (!dateString) return 'Non disponibile';

    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // 🎨 Nascondi alert
  hideAlert(): void {
    this.showAlert = false;
    this.cdr.detectChanges();
  }
}
