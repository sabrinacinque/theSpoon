import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { ILoginRequest } from '../../../models/ilogin-request';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  @Output() switchToRegister = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<void>();

  // Form data
  loginData: ILoginRequest = {
    email: '',
    password: ''
  };

  // State
  loading = false;
  error: string | null = null;
  showPassword = false;

  constructor(private authService: AuthService) {}

  onSubmit() {
    if (!this.isFormValid()) {
      this.error = 'Compila tutti i campi richiesti';
      return;
    }

    this.loading = true;
    this.error = null;

    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (response) => {
        this.loading = false;

        if (response.success) {
          console.log('✅ Login effettuato con successo');
          this.loginSuccess.emit();
        } else {
          this.error = response.message || 'Errore durante il login';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Errore di connessione. Riprova più tardi.';
        console.error('❌ Errore login:', error);
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  goToRegister() {
    this.switchToRegister.emit();
  }

  private isFormValid(): boolean {
    return !!(this.loginData.email && this.loginData.password);
  }

  // Validazione email
  isEmailValid(): boolean {
    if (!this.loginData.email) return true; // Non mostrare errore se vuoto
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.loginData.email);
  }
}
