import { AuthModalComponent } from './../../components/auth/auth-modal/auth-modal';
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, AuthModalComponent],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  @Output() goHome = new EventEmitter<void>();

  // 🔐 AUTH MODAL STATE
  isAuthModalOpen = false;

  constructor(
    public themeService: ThemeService,
    public authService: AuthService,
    private router: Router // ← AGGIUNTO Router per navigazione
  ) {}

  onThemeToggle() {
    this.themeService.toggleTheme();
    this.closeMobileNavbar(); // ← CHIUDI NAVBAR MOBILE
  }

  onGoHome() {
    this.goHome.emit();
    this.closeMobileNavbar(); // ← CHIUDI NAVBAR MOBILE
  }

  // 🔐 AUTH MODAL METHODS
  openAuthModal() {
    console.log('🔐 Apertura modal auth');
    this.isAuthModalOpen = true;
    this.closeMobileNavbar(); // ← CHIUDI NAVBAR MOBILE
  }

  closeAuthModal() {
    console.log('🔒 Chiusura modal auth');
    this.isAuthModalOpen = false;
  }

  onAuthSuccess() {
    console.log('✅ Autenticazione completata dalla navbar');
    this.closeAuthModal();
  }

  // 🔓 LOGOUT
  logout() {
    console.log('🔓 Logout dalla navbar');
    this.authService.logout();
    this.closeMobileNavbar(); // ← CHIUDI NAVBAR MOBILE
  }

  // 👤 DASHBOARD CUSTOMER
  goToCustomerDashboard() {
    console.log('👤 Navigazione alla dashboard customer');
    this.router.navigate(['/dashboard-customer']);
    this.closeMobileNavbar(); // ← CHIUDI NAVBAR MOBILE
  }

  // 📱 CHIUDI NAVBAR MOBILE
  private closeMobileNavbar() {
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
      const navbarToggler = document.querySelector('.navbar-toggler') as HTMLElement;
      if (navbarToggler) {
        navbarToggler.click();
      }
    }
  }

  getUserDisplayName(): string {
  const currentUser = this.authService.currentUser();

  if (currentUser?.firstName && currentUser?.lastName) {
    return `${currentUser.firstName} ${currentUser.lastName}`;
  } else if (currentUser?.firstName) {
    return currentUser.firstName;
  } else if (currentUser?.email) {
    return currentUser.email.split('@')[0]; // Usa parte email prima di @
  } else {
    return 'Utente'; // Fallback
  }
}

  // 🎯 GETTER CONVENIENCE
  get isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  get userFullName() {
    return this.authService.getUserFullName();
  }

  get userEmail() {
    return this.authService.getUserEmail();
  }
}
