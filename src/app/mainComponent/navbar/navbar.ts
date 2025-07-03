import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  @Output() goHome = new EventEmitter<void>();
  @Output() goLogin = new EventEmitter<void>();

  constructor(public themeService: ThemeService) {}

  onThemeToggle() {
    this.themeService.toggleTheme();
  }

  onGoHome() {
    this.goHome.emit();
  }

  onGoLogin() {
    this.goLogin.emit();
  }
}
