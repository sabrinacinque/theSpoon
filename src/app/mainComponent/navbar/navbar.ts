import { Component, Input, Output, EventEmitter, Renderer2, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  @Input() isDarkTheme: boolean = true;
  @Output() themeToggle = new EventEmitter<void>();
  @Output() goHome = new EventEmitter<void>();
  @Output() goLogin = new EventEmitter<void>();

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  onThemeToggle() {
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
    this.themeToggle.emit();
  }

  private applyTheme() {
    const theme = this.isDarkTheme ? 'dark' : 'light';
    this.renderer.setAttribute(this.document.documentElement, 'data-bs-theme', theme);
    this.renderer.setAttribute(this.document.body, 'data-theme', theme);
  }

  onGoHome() {
    this.goHome.emit();
  }

  onGoLogin() {
    this.goLogin.emit();
  }
}
