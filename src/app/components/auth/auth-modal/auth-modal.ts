import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from '../login/login';
import { RegisterComponent } from '../register/register';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, LoginComponent, RegisterComponent],
  templateUrl: './auth-modal.html',
  styleUrls: ['./auth-modal.css']
})
export class AuthModalComponent {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() authSuccess = new EventEmitter<void>();

  // 🔄 MODALITÀ: 'login' o 'register'
  currentMode: 'login' | 'register' = 'login';

  // 🔒 CHIUDI MODAL
  close() {
    this.closeModal.emit();
    this.resetModal();
  }

  // 🔄 SWITCH TRA LOGIN E REGISTER
  switchToRegister() {
    this.currentMode = 'register';
  }

  switchToLogin() {
    this.currentMode = 'login';
  }

  // ✅ SUCCESSO AUTENTICAZIONE
  onAuthSuccess() {
    console.log('✅ Autenticazione completata nel modal');
    this.authSuccess.emit();
    this.close();
  }

  // 🔄 RESET MODAL
  private resetModal() {
    this.currentMode = 'login';
  }

  // 🎯 GETTER
  get isLoginMode() {
    return this.currentMode === 'login';
  }

  get isRegisterMode() {
    return this.currentMode === 'register';
  }
}
