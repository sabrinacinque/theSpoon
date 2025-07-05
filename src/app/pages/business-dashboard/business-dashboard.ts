import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

// Import dei componenti dashboard
import { DashboardOverview } from './components/dashboard-overview/dashboard-overview';
import { ProfileSection } from './components/profile-section/profile-section';
import { RestaurantSection } from './components/restaurant-section/restaurant-section';
import { SubscriptionSection } from './components/subscription-section/subscription-section';
import { SettingsSection } from './components/settings-section/settings-section';
import { DeleteAccountSection } from './components/delete-account-section/delete-account-section';

interface DashboardTab {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

@Component({
  selector: 'app-business-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardOverview,
    ProfileSection,
    RestaurantSection,
    SubscriptionSection,
    SettingsSection,
    DeleteAccountSection
  ],
  templateUrl: './business-dashboard.html',
  styleUrls: ['./business-dashboard.css']
})
export class BusinessDashboardComponent implements OnInit {

  // 🎯 Tab attivo
  activeTab: string = localStorage.getItem('dashboard_active_tab') || 'dashboard';


  // 📋 Configurazione tab
  tabs: DashboardTab[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Panoramica generale'
    },
    {
      id: 'profilo',
      label: 'Profilo',
      icon: '👤',
      description: 'Dati business e ristorante'
    },
    {
      id: 'abbonamento',
      label: 'Abbonamento',
      icon: '💎',
      description: 'Piano e fatturazione'
    },
    {
      id: 'impostazioni',
      label: 'Impostazioni',
      icon: '⚙️',
      description: 'Preferenze account'
    },
    {
      id: 'elimina',
      label: 'Elimina Account',
      icon: '🗑️',
      description: 'Cancella definitivamente'
    }
  ];

  // 👤 Dati utente - DICHIARATE MA INIZIALIZZATE NEL CONSTRUCTOR
  currentUser: any;
  userFullName: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // 🔧 INIZIALIZZA DOPO L'INIEZIONE
    this.currentUser = this.authService.currentUser;
    this.userFullName = this.authService.getUserFullName();
  }

  ngOnInit(): void {
    // 🔒 Verifica autenticazione business
    if (!this.authService.isLoggedIn()) {
      console.log('❌ Accesso negato: utente non autenticato');
      this.router.navigate(['/']);
      return;
    }

    if (!this.authService.isBusiness()) {
      console.log('❌ Accesso negato: solo per account business');
      this.router.navigate(['/']);
      return;
    }

    console.log('✅ Business Dashboard caricata per:', this.userFullName);
  }

  // 🔄 Cambia tab attivo
  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
    localStorage.setItem('dashboard_active_tab', tabId); // ← AGGIUNGI QUESTA RIGA
    console.log('📋 Tab attivo:', tabId);
  }

  // 🎨 Verifica se tab è attivo
  isTabActive(tabId: string): boolean {
    return this.activeTab === tabId;
  }

  // 🏠 Torna alla homepage
  goToHomepage(): void {
    this.router.navigate(['/']);
  }
}
