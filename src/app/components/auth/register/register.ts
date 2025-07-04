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
  currentStep = 1; // Per business: 1 = dati personali, 2 = dati business, 3 = piano

  // 📝 FORM DATA con la TUA interfaccia ESATTA
  registerData: IRegisterRequest = {
    // Dati base (sempre inizializzati)
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'CUSTOMER'
    // I campi business sono opzionali e vengono aggiunti solo per BUSINESS
  };

  // Extra campi per Restaurant e Subscription (non nell'interfaccia base)
  restaurantData = {
    restaurantName: '',
    phoneNumber: '',
    description: '',
    cuisineType: '',
    giornoChiusura: '',
    subscriptionType: 'BASIC' as 'BASIC' | 'GOLD'
  };

  // State
  loading = false;
  error: string | null = null;

  constructor(private authService: AuthService) {}

  // 🔄 SWITCH TIPO REGISTRAZIONE
  setRegistrationType(type: 'CUSTOMER' | 'BUSINESS') {
    this.registrationType = type;
    this.registerData.role = type;
    this.currentStep = 1;
    this.error = null;

    if (type === 'CUSTOMER') {
      // CUSTOMER: rimuovi tutti i campi business
      delete this.registerData.businessName;
      delete this.registerData.phone;
      delete this.registerData.partitaIva;
      delete this.registerData.address;
      delete this.registerData.city;
      delete this.registerData.province;
      delete this.registerData.zipCode;

      // Reset restaurant data
      this.restaurantData = {
        restaurantName: '',
        phoneNumber: '',
        description: '',
        cuisineType: '',
        giornoChiusura: '',
        subscriptionType: 'BASIC'
      };
    } else {
      // BUSINESS: aggiungi campi business con default
      this.registerData.businessName = '';
      this.registerData.phone = '';
      this.registerData.partitaIva = '';
      this.registerData.address = '';
      this.registerData.city = '';
      this.registerData.province = '';
      this.registerData.zipCode = '';
    }
  }

  // ➡️ PROSSIMO STEP (solo business)
  nextStep() {
    if (this.currentStep === 1 && this.validatePersonalData()) {
      this.currentStep = 2;
      this.error = null;
    } else if (this.currentStep === 2 && this.validateBusinessData()) {
      this.currentStep = 3;
      this.error = null;
    }
  }

  // ⬅️ STEP PRECEDENTE
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.error = null;
    }
  }

  // 📝 SUBMIT REGISTRAZIONE
  onSubmit() {
    if (!this.isFormValid()) {
      return;
    }

    this.loading = true;
    this.error = null;

    // Prepara dati per backend
    let dataToSend: any = { ...this.registerData };

    // Se BUSINESS, aggiungi dati restaurant
    if (this.registrationType === 'BUSINESS') {
      dataToSend = {
        ...dataToSend,
        restaurantName: this.restaurantData.restaurantName,
        // phoneNumber: this.restaurantData.phoneNumber, // ← COMMENTA QUESTA RIGA
        description: this.restaurantData.description,
        cuisineType: this.restaurantData.cuisineType,
        giornoChiusura: this.restaurantData.giornoChiusura,
        subscriptionType: this.restaurantData.subscriptionType
      };
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

  // ✅ VALIDAZIONI
  validatePersonalData(): boolean {
    if (!this.registerData.firstName.trim()) {
      this.error = 'Nome è richiesto';
      return false;
    }
    if (!this.registerData.lastName.trim()) {
      this.error = 'Cognome è richiesto';
      return false;
    }
    if (!this.registerData.email.trim()) {
      this.error = 'Email è richiesta';
      return false;
    }
    if (!this.isEmailValid(this.registerData.email)) {
      this.error = 'Email non valida';
      return false;
    }
    if (!this.registerData.password || this.registerData.password.length < 6) {
      this.error = 'Password deve essere almeno 6 caratteri';
      return false;
    }
    return true;
  }

  validateBusinessData(): boolean {
    if (!this.registerData.businessName?.trim()) {
      this.error = 'Nome business è richiesto';
      return false;
    }
    if (!this.registerData.partitaIva?.trim()) {
      this.error = 'Partita IVA è richiesta';
      return false;
    }
    if (!this.registerData.address?.trim()) {
      this.error = 'Indirizzo è richiesto';
      return false;
    }
    if (!this.registerData.city?.trim()) {
      this.error = 'Città è richiesta';
      return false;
    }
    if (!this.restaurantData.restaurantName?.trim()) {
      this.error = 'Nome ristorante è richiesto';
      return false;
    }
    return true;
  }

  private isFormValid(): boolean {
    if (this.registrationType === 'CUSTOMER') {
      return this.validatePersonalData();
    } else {
      return this.validatePersonalData() &&
             this.validateBusinessData() &&
             !!this.restaurantData.subscriptionType;
    }
  }

  isEmailValid(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 🎯 SUBSCRIPTION PLAN
  selectPlan(plan: 'BASIC' | 'GOLD') {
    this.restaurantData.subscriptionType = plan;
  }

  // 🔗 VAI A LOGIN
  goToLogin() {
    this.switchToLogin.emit();
  }

  // 🎯 GETTER CONVENIENCE
  get isStep1() {
    return this.currentStep === 1;
  }

  get isStep2() {
    return this.currentStep === 2;
  }

  get isStep3() {
    return this.currentStep === 3;
  }

  get isCustomer() {
    return this.registrationType === 'CUSTOMER';
  }

  get isBusiness() {
    return this.registrationType === 'BUSINESS';
  }
}
