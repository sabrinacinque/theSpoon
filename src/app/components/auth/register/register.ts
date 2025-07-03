import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { IRegisterRequest } from '../../../models/iregister-request';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  @Output() switchToLogin = new EventEmitter<void>();
  @Output() registerSuccess = new EventEmitter<void>();

  // 🔄 TOGGLE TIPO REGISTRAZIONE
  registrationType: 'CUSTOMER' | 'BUSINESS' = 'CUSTOMER';

  // 📝 FORM DATA UNIFICATO
  registerData: IRegisterRequest = {
    // Dati base
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'CUSTOMER',

    // Dati business (opzionali)
    businessName: '',
    phone: '',
    partitaIva: '',
    address: '',
    city: '',
    province: '',
    zipCode: ''
  };

  // State
  loading = false;
  error: string | null = null;
  showPassword = false;
  currentStep = 1; // Per business: step 1 = dati personali, step 2 = dati business

  constructor(private authService: AuthService) {}

  // 🔄 SWITCH TIPO REGISTRAZIONE
  switchRegistrationType(type: 'CUSTOMER' | 'BUSINESS') {
    this.registrationType = type;
    this.registerData.role = type;
    this.currentStep = 1;
    this.error = null;

    // Reset campi business se switch a customer
    if (type === 'CUSTOMER') {
      this.registerData.businessName = '';
      this.registerData.phone = '';
      this.registerData.partitaIva = '';
      this.registerData.address = '';
      this.registerData.city = '';
      this.registerData.province = '';
      this.registerData.zipCode = '';
    }
  }

  // 📝 SUBMIT FORM
  onSubmit() {
    if (this.registrationType === 'CUSTOMER') {
      this.submitRegistration();
    } else {
      if (this.currentStep === 1) {
        this.nextStep();
      } else {
        this.submitRegistration();
      }
    }
  }

  // 🚀 REGISTRAZIONE (UNICO ENDPOINT)
  private submitRegistration() {
    if (!this.isFormValid()) {
      this.error = 'Compila tutti i campi richiesti';
      return;
    }

    this.loading = true;
    this.error = null;

    // Prepara dati per backend
    const dataToSend: IRegisterRequest = {
      email: this.registerData.email,
      password: this.registerData.password,
      firstName: this.registerData.firstName,
      lastName: this.registerData.lastName,
      role: this.registerData.role
    };

    // Aggiungi dati business solo se necessario
    if (this.registrationType === 'BUSINESS') {
      dataToSend.businessName = this.registerData.businessName;
      dataToSend.phone = this.registerData.phone;
      dataToSend.partitaIva = this.registerData.partitaIva;
      dataToSend.address = this.registerData.address;
      dataToSend.city = this.registerData.city;
      dataToSend.province = this.registerData.province;
      dataToSend.zipCode = this.registerData.zipCode;
    }

    this.authService.register(dataToSend).subscribe({
      next: (response) => {
        this.loading = false;

        if (response.success) {
          console.log(`✅ Registrazione ${this.registrationType} completata`);
          this.registerSuccess.emit();
        } else {
          this.error = response.message || 'Errore durante la registrazione';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Errore di connessione. Riprova più tardi.';
        console.error('❌ Errore registrazione:', error);
      }
    });
  }

  // ➡️ PROSSIMO STEP (solo business)
  nextStep() {
    if (!this.isPersonalDataValid()) {
      this.error = 'Compila tutti i dati personali';
      return;
    }

    this.currentStep = 2;
    this.error = null;
  }

  // ⬅️ STEP PRECEDENTE
  previousStep() {
    this.currentStep = 1;
    this.error = null;
  }

  // 👁️ TOGGLE PASSWORD
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // 🔗 VAI A LOGIN
  goToLogin() {
    this.switchToLogin.emit();
  }

  // ✅ VALIDAZIONI
  private isFormValid(): boolean {
    if (this.registrationType === 'CUSTOMER') {
      return this.isPersonalDataValid();
    } else {
      return this.isPersonalDataValid() && this.isBusinessDataValid();
    }
  }

  private isPersonalDataValid(): boolean {
    return !!(
      this.registerData.email &&
      this.registerData.password &&
      this.registerData.firstName &&
      this.registerData.lastName &&
      this.isEmailValid(this.registerData.email) &&
      this.registerData.password.length >= 6
    );
  }

  private isBusinessDataValid(): boolean {
    return !!(
      this.registerData.businessName &&
      this.registerData.phone &&
      this.registerData.partitaIva &&
      this.registerData.address &&
      this.registerData.city &&
      this.registerData.province &&
      this.registerData.zipCode
    );
  }

  isEmailValid(email: string): boolean {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 🎯 GETTER CONVENIENCE
  get isStep1() {
    return this.currentStep === 1;
  }

  get isStep2() {
    return this.currentStep === 2;
  }

  get isCustomer() {
    return this.registrationType === 'CUSTOMER';
  }

  get isBusiness() {
    return this.registrationType === 'BUSINESS';
  }
}
