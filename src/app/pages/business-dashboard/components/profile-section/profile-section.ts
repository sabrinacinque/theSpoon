import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RestaurantService } from '../../../../services/restaurant';
import { AuthService } from '../../../../services/auth';
import { IRestaurant } from '../../../../models/i-restaurant';

interface EditableField {
  name: string;
  value: string;
  editing: boolean;
  originalValue: string;
  loading: boolean;
  required: boolean;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  options?: string[];
}

@Component({
  selector: 'app-profile-section',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './profile-section.html',
  styleUrls: ['./profile-section.css']
})
export class ProfileSection implements OnInit {

  // 🏪 Dati ristorante
  restaurant: IRestaurant | null = null;
  currentRestaurantId: number = 0;

  // 🔄 Loading states
  loading: boolean = true;
  error: string | null = null;
  saving: boolean = false;

  // ✏️ Campi modificabili
  editableFields: EditableField[] = [];

  // 📅 Opzioni per giorni chiusura
  giornoChiusuraOptions: string[] = [
    'NESSUNO', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'
  ];

  // 🍽️ Opzioni tipi cucina
  cuisineTypeOptions: string[] = [
    'Italiana', 'Napoletana', 'Lombarda', 'Romana', 'Toscana', 'Siciliana',
    'Pizzeria', 'Trattoria', 'Osteria', 'Ristorante', 'Fusion'
  ];

  constructor(
    private restaurantService: RestaurantService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRestaurantProfile();
  }

  // 🏪 Carica profilo ristorante
  private loadRestaurantProfile(): void {
    const currentUser = this.authService.currentUser();

    if (!currentUser || !this.authService.isBusiness()) {
      this.error = 'Errore: utente non autorizzato';
      this.loading = false;
      return;
    }

    // TODO: Implementare chiamata per ottenere il restaurant ID dall'utente
    // Per ora usiamo ID 8 come nella dashboard
    this.currentRestaurantId = 8;

    this.restaurantService.getRestaurantById(this.currentRestaurantId).subscribe({
      next: (restaurant: IRestaurant) => {
        this.restaurant = restaurant;
        this.initializeEditableFields();
        this.loading = false;
        this.cdr.detectChanges();
        console.log('✅ Profilo ristorante caricato:', restaurant);
      },
      error: (error) => {
        this.error = 'Errore nel caricamento del profilo';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('❌ Errore caricamento profilo:', error);
      }
    });
  }

  // ✏️ Inizializza campi modificabili
  private initializeEditableFields(): void {
    if (!this.restaurant) return;

    this.editableFields = [
      {
        name: 'name',
        value: this.restaurant.name || '',
        editing: false,
        originalValue: this.restaurant.name || '',
        loading: false,
        required: true,
        type: 'text'
      },
      {
        name: 'address',
        value: this.restaurant.address || '',
        editing: false,
        originalValue: this.restaurant.address || '',
        loading: false,
        required: true,
        type: 'text'
      },
      {
        name: 'city',
        value: this.restaurant.city || '',
        editing: false,
        originalValue: this.restaurant.city || '',
        loading: false,
        required: true,
        type: 'text'
      },
      {
        name: 'phoneNumber',
        value: this.restaurant.phoneNumber || '',
        editing: false,
        originalValue: this.restaurant.phoneNumber || '',
        loading: false,
        required: true,
        type: 'tel'
      },
      {
        name: 'description',
        value: this.restaurant.description || '',
        editing: false,
        originalValue: this.restaurant.description || '',
        loading: false,
        required: false,
        type: 'textarea'
      },
      {
        name: 'cuisineType',
        value: this.restaurant.cuisineType || '',
        editing: false,
        originalValue: this.restaurant.cuisineType || '',
        loading: false,
        required: true,
        type: 'select',
        options: this.cuisineTypeOptions
      },
      {
        name: 'giornoChiusura',
        value: this.restaurant.giornoChiusura || 'NESSUNO',
        editing: false,
        originalValue: this.restaurant.giornoChiusura || 'NESSUNO',
        loading: false,
        required: true,
        type: 'select',
        options: this.giornoChiusuraOptions
      }
    ];
  }

  // ✏️ Abilita modifica campo
  startEdit(field: EditableField): void {
    // Disabilita altri campi in editing
    this.editableFields.forEach(f => {
      if (f !== field && f.editing) {
        this.cancelEdit(f);
      }
    });

    field.editing = true;
    field.originalValue = field.value;
    this.cdr.detectChanges();
    console.log('✏️ Modifica campo:', field.name);
  }

  // 💾 Salva modifica campo
  saveField(field: EditableField): void {
    if (field.required && !field.value.trim()) {
      alert('Questo campo è obbligatorio');
      return;
    }

    field.loading = true;
    this.cdr.detectChanges();

    // 🔥 VERA API CALL - Non più simulazione!
    const currentUser = this.authService.currentUser();
    const businessId = currentUser?.userId || 0;

    this.restaurantService.updateRestaurantField(
      this.currentRestaurantId,
      field.name,
      field.value,
      businessId
    ).subscribe({
      next: (updatedRestaurant: IRestaurant) => {
        // Aggiorna il restaurant object con i nuovi dati
        this.restaurant = updatedRestaurant;

        field.editing = false;
        field.loading = false;
        field.originalValue = field.value;
        this.cdr.detectChanges();

        console.log('💾 Campo salvato nel database:', field.name, '=', field.value);
      },
      error: (error) => {
        console.error('❌ Errore salvataggio campo:', error);

        // Ripristina valore originale in caso di errore
        field.value = field.originalValue;
        field.editing = false;
        field.loading = false;
        this.cdr.detectChanges();

        alert('Errore durante il salvataggio. Riprova.');
      }
    });
  }

  // ❌ Annulla modifica campo
  cancelEdit(field: EditableField): void {
    field.value = field.originalValue;
    field.editing = false;
    field.loading = false;
    this.cdr.detectChanges();
    console.log('❌ Modifica annullata:', field.name);
  }

  // 🔍 Ottieni campo per nome
  getField(fieldName: string): EditableField | undefined {
    return this.editableFields.find(f => f.name === fieldName);
  }

  // 📝 Formatta label campo
  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'name': 'Nome Ristorante',
      'address': 'Indirizzo',
      'city': 'Città',
      'phoneNumber': 'Telefono',
      'description': 'Descrizione',
      'cuisineType': 'Tipo Cucina',
      'giornoChiusura': 'Giorno Chiusura'
    };
    return labels[fieldName] || fieldName;
  }

  // 📝 Formatta giorno chiusura per display
  formatGiornoChiusura(giorno: string): string {
    const giorni: { [key: string]: string } = {
      'NESSUNO': 'Sempre aperto',
      'LUN': 'Lunedì',
      'MAR': 'Martedì',
      'MER': 'Mercoledì',
      'GIO': 'Giovedì',
      'VEN': 'Venerdì',
      'SAB': 'Sabato',
      'DOM': 'Domenica'
    };
    return giorni[giorno] || giorno;
  }

  // 🔄 Ricarica profilo
  refreshProfile(): void {
    this.loading = true;
    this.error = null;
    this.loadRestaurantProfile();
  }

  // 🎨 Ottieni icona per campo
  getFieldIcon(fieldName: string): string {
    const icons: { [key: string]: string } = {
      'name': 'fas fa-store',
      'address': 'fas fa-map-marker-alt',
      'city': 'fas fa-city',
      'phoneNumber': 'fas fa-phone',
      'description': 'fas fa-align-left',
      'cuisineType': 'fas fa-utensils',
      'giornoChiusura': 'fas fa-calendar-times'
    };
    return icons[fieldName] || 'fas fa-edit';
  }
}
