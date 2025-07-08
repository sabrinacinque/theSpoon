import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { ILoginRequest } from '../../../models/ilogin-request';
import Swal from 'sweetalert2';

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

  // 🔑 FORGOT PASSWORD MODAL
  async openForgotPasswordModal(): Promise<void> {
    const { value: email } = await Swal.fire({
      title: '🔑 Recupera Password',
      html: `
        <div style="text-align: left; margin: 1rem 0;">
          <p style="margin-bottom: 1rem;">Inserisci la tua email e ti invieremo un link per reimpostare la password.</p>

          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email:</label>
            <input
              id="reset-email"
              type="email"
              class="swal2-input"
              placeholder="La tua email registrata"
              style="margin: 0; width: 100%;"
              value="${this.loginData.email || ''}">
          </div>

          <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px; font-size: 0.9em; color: #1565c0;">
            <p style="margin: 0;"><strong>📧 Riceverai un'email con le istruzioni</strong></p>
            <p style="margin: 0.5rem 0 0 0;">Controlla anche la cartella spam!</p>
          </div>
        </div>
      `,
      width: '500px',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-paper-plane"></i> Invia Link',
      cancelButtonText: '<i class="fas fa-times"></i> Annulla',
      confirmButtonColor: '#1976d2',
      focusConfirm: false,
      preConfirm: () => {
        const email = (document.getElementById('reset-email') as HTMLInputElement).value;

        if (!email) {
          Swal.showValidationMessage('Inserisci la tua email');
          return false;
        }

        if (!this.isValidEmail(email)) {
          Swal.showValidationMessage('Inserisci un indirizzo email valido');
          return false;
        }

        return email;
      }
    });

    if (email) {
      await this.sendPasswordResetEmail(email);
    }
  }

  // 📧 INVIA EMAIL RESET PASSWORD - FIX ERRORI
  private async sendPasswordResetEmail(email: string): Promise<void> {
    // Mostra loading
    Swal.fire({
      title: 'Invio in corso...',
      html: 'Stiamo inviando l\'email di recupero...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // 🔥 CHIAMATA API per inviare email reset
      await this.authService.sendPasswordResetEmail(email).toPromise();

      console.log('📧 Email reset password inviata a:', email);

      // Successo
      Swal.fire({
        title: '📧 Email Inviata!',
        html: `
          <div style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
            <p style="margin-bottom: 1rem;">Ti abbiamo inviato un'email con le istruzioni per reimpostare la password.</p>

            <div style="background: #e8f5e8; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <p style="margin: 0; color: #2e7d32;"><strong>📧 Email inviata a:</strong></p>
              <p style="margin: 0.5rem 0 0 0; color: #2e7d32; font-weight: 600;">${email}</p>
            </div>

            <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <p style="margin: 0; color: #856404;"><strong>⏰ Il link scadrà tra 1 ora</strong></p>
              <p style="margin: 0.5rem 0 0 0; color: #856404;">Controlla anche la cartella spam!</p>
            </div>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Ho capito',
        confirmButtonColor: '#28a745',
        timer: 8000,
        timerProgressBar: true
      });

    } catch (error: any) { // ← FIX: Tipo esplicito any
      console.error('❌ Errore invio email reset:', error);

      let errorMessage = 'Si è verificato un errore durante l\'invio dell\'email.';

      if (error?.status === 404) { // ← FIX: Optional chaining
        errorMessage = 'Email non trovata. Verifica di aver inserito l\'email corretta.';
      } else if (error?.error?.message) { // ← FIX: Optional chaining
        errorMessage = error.error.message;
      }

      Swal.fire({
        title: '❌ Errore Invio',
        html: `
          <div style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📧</div>
            <p style="margin-bottom: 1rem;">${errorMessage}</p>
            <div style="background: #f8d7da; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <p style="margin: 0; color: #721c24;"><strong>Suggerimenti:</strong></p>
              <ul style="text-align: left; margin: 0.5rem 0 0 0; color: #721c24;">
                <li>Verifica che l'email sia corretta</li>
                <li>Controlla di aver registrato l'account</li>
                <li>Riprova tra qualche minuto</li>
              </ul>
            </div>
          </div>
        `,
        icon: 'error',
        confirmButtonText: 'Riprova',
        confirmButtonColor: '#dc3545'
      });
    }
  }

  // 🔧 UTILITY EMAIL VALIDATION
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
