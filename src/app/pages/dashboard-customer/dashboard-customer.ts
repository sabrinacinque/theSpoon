// dashboard-customer.ts
import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ReservationService } from '../../services/reservation';
import { ThemeService } from '../../services/theme';
import { IUser } from '../../models/iuser';
import { IReservation } from '../../models/ireservation';

// Import dei componenti figli
import { MyReservations } from './components/my-reservations/my-reservations';
import { MyProfile } from './components/my-profile/my-profile';
import { MyReviews } from './components/my-reviews/my-reviews';

@Component({
  selector: 'app-dashboard-customer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // ← AGGIUNTO per performance
  imports: [
    CommonModule,
    RouterModule,
    MyReservations,
    MyProfile,
    MyReviews
  ],
  templateUrl: './dashboard-customer.html',
  styleUrls: ['./dashboard-customer.css']
})
export class DashboardCustomer implements OnInit {
  activeTab: string = 'reservations';
  currentUser: IUser | null = null;
  reservations: IReservation[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private reservationService: ReservationService,
    public themeService: ThemeService,
    private cdr: ChangeDetectorRef // ← AGGIUNTO per forzare aggiornamenti
  ) {
    // Recupera tab attivo dal localStorage
    const savedTab = localStorage.getItem('customer_dashboard_tab');
    if (savedTab) {
      this.activeTab = savedTab;
    }
  }

  ngOnInit(): void {
    console.log('🏠 Dashboard Customer inizializzata');
    this.loadUserData();
    this.loadReservations();
  }

  private loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.error = 'Errore nel caricamento dei dati utente';
      this.loading = false;
      console.error('❌ Utente non trovato');
    } else {
      console.log('✅ Utente caricato:', this.currentUser.firstName, this.currentUser.lastName);
    }
    
    // 🔥 FORZA CHANGE DETECTION
    this.cdr.detectChanges();
  }

  private loadReservations(): void {
    if (!this.currentUser) {
      console.error('❌ Impossibile caricare prenotazioni: utente non disponibile');
      return;
    }

    console.log('📅 Caricamento prenotazioni per utente ID:', this.currentUser.userId);

    this.reservationService.getReservationsByCustomer(this.currentUser.userId).subscribe({
      next: (reservations) => {
        console.log('✅ Prenotazioni caricate:', reservations);
        console.log('📊 Numero prenotazioni:', reservations.length);
        
        this.reservations = reservations;
        this.loading = false;
        this.error = null;
        
        // 🔥 FORZA CHANGE DETECTION
        this.cdr.detectChanges();
        
        console.log('🔄 Change detection forzato - loading:', this.loading);
      },
      error: (error) => {
        console.error('❌ Errore nel caricamento delle prenotazioni:', error);
        this.error = 'Errore nel caricamento delle prenotazioni';
        this.loading = false;
        this.reservations = [];
        
        // 🔥 FORZA CHANGE DETECTION ANCHE IN CASO DI ERRORE
        this.cdr.detectChanges();
      }
    });
  }

  setActiveTab(tab: string): void {
    console.log('📋 Cambio tab a:', tab);
    this.activeTab = tab;
    localStorage.setItem('customer_dashboard_tab', tab);
    
    // 🔥 FORZA CHANGE DETECTION quando cambi tab
    this.cdr.detectChanges();
  }

  refreshReservations(): void {
    console.log('🔄 Refresh prenotazioni...');
    this.loading = true;
    this.error = null;
    
    // 🔥 FORZA CHANGE DETECTION per mostrare loading
    this.cdr.detectChanges();
    
    this.loadReservations();
  }

  get isDarkTheme(): boolean {
    return this.themeService.isDarkTheme();
  }

  // 🔧 Metodi di debug/utility
  onTabClick(tabName: string): void {
    console.log('🖱️ Click su tab:', tabName);
    this.setActiveTab(tabName);
  }

  // 📊 Getter per template
  get hasReservations(): boolean {
    return this.reservations.length > 0;
  }

  get reservationCount(): number {
    return this.reservations.length;
  }

  // 🎨 CSS classes dinamiche
  getTabClass(tabName: string): string {
    return this.activeTab === tabName ? 'nav-link active' : 'nav-link';
  }

  getContainerClass(): string {
    return `dashboard-customer-container ${this.isDarkTheme ? 'dark-theme' : 'light-theme'}`;
  }
}