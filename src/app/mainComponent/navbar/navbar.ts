import { AuthModalComponent } from './../../components/auth/auth-modal/auth-modal';
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, AuthModalComponent], // ← AGGIUNTO AuthModalComponent
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  @Output() goHome = new EventEmitter<void>();
  // ❌ RIMOSSO goLogin perché ora usiamo il modal

  // 🔐 AUTH MODAL STATE
  isAuthModalOpen = false;

  constructor(
    public themeService: ThemeService,
    public authService: AuthService // ← AGGIUNTO AuthService
  ) {}

  onThemeToggle() {
    this.themeService.toggleTheme();
  }

  onGoHome() {
    this.goHome.emit();
  }

  // 🔐 AUTH MODAL METHODS
  openAuthModal() {
    console.log('🔐 Apertura modal auth');
    this.isAuthModalOpen = true;
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
