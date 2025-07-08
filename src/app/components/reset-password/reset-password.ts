// reset-password.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
      <div class="reset-container">

        <!-- Loading State -->
        <div *ngIf="loading" class="text-center py-5">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Verifica token...</span>
          </div>
          <p class="text-muted">Verifica del link in corso...</p>
        </div>

        <!-- Invalid Token -->
        <div *ngIf="!loading && !isValidToken" class="text-center py-5">
          <div class="mb-4">
            <i class="fas fa-exclamation-triangle fa-3x text-warning"></i>
          </div>
          <h3 class="text-danger">Link Non Valido</h3>
          <p class="text-muted mb-4">Il link per il reset della password è scaduto o non valido.</p>
          <button class="btn btn-primary" (click)="goToLogin()">
            <i class="fas fa-arrow-left me-2"></i>
            Torna al Login
          </button>
        </div>

        <!-- Reset Form -->
        <div *ngIf="!loading && isValidToken" class="reset-form">
          <div class="text-center mb-4">
            <i class="fas fa-key fa-3x text-primary mb-3"></i>
            <h2 class="fw-bold">Reimposta Password</h2>
            <p class="text-muted">Inserisci la tua nuova password</p>
          </div>

          <form (ngSubmit)="onSubmit()" #resetForm="ngForm">

            <!-- New Password -->
            <div class="mb-3">
              <label for="newPassword" class="form-label">Nuova Password</label>
              <div class="input-group">
                <span class="input-group-text">
                  <i class="fas fa-lock"></i>
                </span>
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  class="form-control"
                  id="newPassword"
                  name="newPassword"
                  [(ngModel)]="resetData.newPassword"
                  placeholder="Inserisci la nuova password"
                  minlength="6"
                  required>
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  (click)="togglePassword()">
                  <i class="fas" [class.fa-eye]="!showPassword" [class.fa-eye-slash]="showPassword"></i>
                </button>
              </div>
              <small class="text-muted">Minimo 6 caratteri</small>
            </div>

            <!-- Confirm Password -->
            <div class="mb-4">
              <label for="confirmPassword" class="form-label">Conferma Password</label>
              <div class="input-group">
                <span class="input-group-text">
                  <i class="fas fa-lock"></i>
                </span>
                <input
                  [type]="showConfirmPassword ? 'text' : 'password'"
                  class="form-control"
                  [class.is-invalid]="!passwordsMatch()"
                  id="confirmPassword"
                  name="confirmPassword"
                  [(ngModel)]="resetData.confirmPassword"
                  placeholder="Conferma la nuova password"
                  required>
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  (click)="toggleConfirmPassword()">
                  <i class="fas" [class.fa-eye]="!showConfirmPassword" [class.fa-eye-slash]="showConfirmPassword"></i>
                </button>
              </div>
              <div *ngIf="!passwordsMatch()" class="invalid-feedback d-block">
                Le password non corrispondono
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              class="btn btn-success w-100 mb-3"
              [disabled]="resetting || !resetForm.valid || !passwordsMatch()">
              <span *ngIf="resetting" class="spinner-border spinner-border-sm me-2"></span>
              {{ resetting ? 'Aggiornamento...' : 'Aggiorna Password' }}
            </button>

          </form>

          <div class="text-center">
            <button type="button" class="btn btn-link" (click)="goToLogin()">
              <i class="fas fa-arrow-left me-1"></i>
              Torna al Login
            </button>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .reset-container {
      width: 100%;
      max-width: 400px;
      background: var(--bg-color);
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .input-group-text {
      background: var(--bg-secondary);
      border-color: var(--border-color);
      color: var(--text-color);
    }

    .form-control {
      background: var(--bg-color);
      border-color: var(--border-color);
      color: var(--text-color);
    }

    .form-control:focus {
      background: var(--bg-color);
      border-color: var(--primary-color);
      color: var(--text-color);
      box-shadow: 0 0 0 0.2rem rgba(0, 205, 181, 0.25);
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  loading = true;
  resetting = false;
  isValidToken = false;
  showPassword = false;
  showConfirmPassword = false;

  resetData = {
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Ottieni token dalla URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];

      if (this.token) {
        this.validateToken();
      } else {
        this.loading = false;
        this.isValidToken = false;
      }
    });
  }

  // 🔍 VALIDA TOKEN
  private validateToken(): void {
    // Per ora impostiamo come valido
    // In futuro: chiamata API per validare il token
    setTimeout(() => {
      this.isValidToken = true;
      this.loading = false;
    }, 1500);
  }

  // 🔑 RESET PASSWORD
  onSubmit(): void {
    if (!this.passwordsMatch() || this.resetData.newPassword.length < 6) {
      return;
    }

    this.resetting = true;

    this.authService.resetPassword(this.token, this.resetData.newPassword).subscribe({
      next: (response) => {
        console.log('✅ Password resettata con successo:', response);
        this.resetting = false;

        Swal.fire({
          title: '🎉 Password Aggiornata!',
          html: `
            <div style="text-align: center;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
              <p style="margin-bottom: 1rem;">La tua password è stata aggiornata con successo!</p>
              <div style="background: #d4edda; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                <p style="margin: 0; color: #155724;"><strong>Ora puoi accedere con la nuova password</strong></p>
              </div>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Vai al Login',
          confirmButtonColor: '#28a745',
          allowOutsideClick: false
        }).then(() => {
          this.goToLogin();
        });
      },
      error: (error) => {
        console.error('❌ Errore reset password:', error);
        this.resetting = false;

        Swal.fire({
          title: 'Errore Reset',
          text: 'Si è verificato un errore durante l\'aggiornamento della password.',
          icon: 'error',
          confirmButtonText: 'Riprova',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  // 🔧 UTILITY METHODS
  passwordsMatch(): boolean {
    return this.resetData.newPassword === this.resetData.confirmPassword;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goToLogin(): void {
    this.router.navigate(['/']);
  }
}

