// settings-section.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PhotoService, IPhoto } from '../../../../services/photo.service';
import { MenuItemService, IMenuItem } from '../../../../services/menu-item.service';
import { RestaurantService } from '../../../../services/restaurant';
import { AuthService } from '../../../../services/auth';

interface EditableMenuItem extends IMenuItem {
  editing: boolean;
  originalName: string;
  originalPrice: number;
  originalCategory: string;
  loading: boolean;
}

@Component({
  selector: 'app-settings-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-section.html',
  styleUrls: ['./settings-section.css']
})
export class SettingsSection implements OnInit {

  // 🏢 ID ristorante
  restaurantId: number | null = null;

  // 📸 Gestione foto
  photos: IPhoto[] = [];
  photosLoading: boolean = false;
  photosError: string | null = null;
  uploadingPhoto: boolean = false;

  // 🍽️ Gestione menu
  menuItems: EditableMenuItem[] = [];
  menuLoading: boolean = false;
  menuError: string | null = null;
  menuGrouped: {[key: string]: EditableMenuItem[]} = {};

  // ➕ Nuovo menu item
  newMenuItem = {
    name: '',
    price: 0,
    category: '',
    adding: false
  };

  // 🏷️ Categorie disponibili
  availableCategories: string[] = [];
  showNewItemForm: boolean = false;

  // 🎯 Tab attivo
  activeTab: 'photos' | 'menu' = 'photos';

  constructor(
    private photoService: PhotoService,
    private menuItemService: MenuItemService,
    private restaurantService: RestaurantService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRestaurantId();
    this.loadDefaultCategories();
  }

  // 🏢 Carica ID ristorante del business loggato
  private loadRestaurantId(): void {
    const currentUser = this.authService.currentUser();

    if (!currentUser || !this.authService.isBusiness()) {
      console.error('❌ Utente non autorizzato per settings');
      return;
    }

    const businessId = currentUser.userId;
    console.log('👤 Business ID per settings:', businessId);

    this.restaurantService.getRestaurantByBusinessId(businessId).subscribe({
      next: (restaurant) => {
        this.restaurantId = restaurant.id;
        console.log('🏪 Restaurant ID per settings:', this.restaurantId);
        this.loadPhotos();
        this.loadMenuItems();
      },
      error: (error) => {
        console.error('❌ Errore caricamento ristorante per settings:', error);
      }
    });
  }

  // 🏷️ Carica categorie predefinite
  private loadDefaultCategories(): void {
    this.availableCategories = this.menuItemService.getDefaultCategories();
  }

  // 🎯 Cambia tab attivo
  setActiveTab(tab: 'photos' | 'menu'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  // 📸 Carica foto ristorante
  loadPhotos(): void {
    if (!this.restaurantId) return;

    this.photosLoading = true;
    this.photosError = null;

    this.photoService.getPhotosByRestaurant(this.restaurantId).subscribe({
      next: (photos) => {
        this.photos = photos;
        this.photosLoading = false;
        this.cdr.detectChanges();
        console.log('📸 Foto caricate:', photos.length);
      },
      error: (error) => {
        console.error('❌ Errore caricamento foto:', error);
        this.photosError = 'Errore nel caricamento delle foto';
        this.photosLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 📤 Upload foto
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || !this.restaurantId) return;

    const file = input.files[0];

    // Validazione file
    if (!file.type.startsWith('image/')) {
      alert('Per favore seleziona un\'immagine valida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      alert('Il file è troppo grande (max 5MB)');
      return;
    }

    this.uploadingPhoto = true;
    this.cdr.detectChanges();

    const isFirstPhoto = this.photos.length === 0;

    this.photoService.uploadPhoto(this.restaurantId, file, isFirstPhoto).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Foto caricata:', response.photo);
          this.loadPhotos(); // Ricarica tutte le foto
        } else {
          console.error('❌ Errore upload:', response.message);
          alert('Errore nel caricamento: ' + response.message);
        }
        this.uploadingPhoto = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Errore upload foto:', error);
        alert('Errore nel caricamento della foto');
        this.uploadingPhoto = false;
        this.cdr.detectChanges();
      }
    });

    // Reset input
    input.value = '';
  }

  // 🎯 Imposta foto principale
  setMainPhoto(photo: IPhoto): void {
    if (!this.restaurantId || photo.isMain) return;

    this.photoService.setMainPhoto(photo.id, this.restaurantId).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Foto principale impostata');
          this.loadPhotos(); // Ricarica per aggiornare i flag
        } else {
          alert('Errore: ' + response.message);
        }
      },
      error: (error) => {
        console.error('❌ Errore impostazione foto principale:', error);
        alert('Errore nell\'impostazione della foto principale');
      }
    });
  }

  // 🗑️ Cancella foto
  deletePhoto(photo: IPhoto): void {
    if (!confirm('Sei sicuro di voler cancellare questa foto?')) return;

    this.photoService.deletePhoto(photo.id).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Foto cancellata');
          this.loadPhotos(); // Ricarica lista
        } else {
          alert('Errore: ' + response.message);
        }
      },
      error: (error) => {
        console.error('❌ Errore cancellazione foto:', error);
        alert('Errore nella cancellazione della foto');
      }
    });
  }

  // 🍽️ Carica menu items
  loadMenuItems(): void {
    if (!this.restaurantId) return;

    this.menuLoading = true;
    this.menuError = null;

    this.menuItemService.getMenuItemsByRestaurant(this.restaurantId).subscribe({
      next: (items) => {
        this.menuItems = items.map(item => ({
          ...item,
          editing: false,
          originalName: item.name,
          originalPrice: item.price,
          originalCategory: item.category,
          loading: false
        }));
        this.groupMenuItems();
        this.menuLoading = false;
        this.cdr.detectChanges();
        console.log('🍽️ Menu items caricati:', items.length);
      },
      error: (error) => {
        console.error('❌ Errore caricamento menu:', error);
        this.menuError = 'Errore nel caricamento del menu';
        this.menuLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 📊 Raggruppa menu items per categoria
  private groupMenuItems(): void {
    this.menuGrouped = {};
    this.menuItems.forEach(item => {
      if (!this.menuGrouped[item.category]) {
        this.menuGrouped[item.category] = [];
      }
      this.menuGrouped[item.category].push(item);
    });
  }

  // 🔄 Ottieni categorie ordinate
  getOrderedCategories(): string[] {
    return Object.keys(this.menuGrouped).sort();
  }

  // ➕ Mostra form nuovo item
  showAddItemForm(): void {
    this.showNewItemForm = true;
    this.newMenuItem = {
      name: '',
      price: 0,
      category: '',
      adding: false
    };
  }

  // ❌ Nascondi form nuovo item
  hideAddItemForm(): void {
    this.showNewItemForm = false;
    this.newMenuItem = {
      name: '',
      price: 0,
      category: '',
      adding: false
    };
  }

  // 💾 Salva nuovo menu item
  saveNewMenuItem(): void {
    if (!this.restaurantId) return;

    if (!this.newMenuItem.name.trim() || !this.newMenuItem.category.trim() || this.newMenuItem.price <= 0) {
      alert('Tutti i campi sono obbligatori e il prezzo deve essere maggiore di 0');
      return;
    }

    this.newMenuItem.adding = true;
    this.cdr.detectChanges();

    this.menuItemService.createMenuItem(
      this.restaurantId,
      this.newMenuItem.name,
      this.newMenuItem.price,
      this.newMenuItem.category
    ).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Menu item creato:', response.menuItem);
          this.hideAddItemForm();
          this.loadMenuItems(); // Ricarica lista
        } else {
          alert('Errore: ' + response.message);
        }
        this.newMenuItem.adding = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Errore creazione menu item:', error);
        alert('Errore nella creazione del menu item');
        this.newMenuItem.adding = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ✏️ Inizia modifica menu item
  startEditMenuItem(item: EditableMenuItem): void {
    // Disabilita modifica per altri item
    this.menuItems.forEach(i => {
      if (i !== item && i.editing) {
        this.cancelEditMenuItem(i);
      }
    });

    item.editing = true;
    item.originalName = item.name;
    item.originalPrice = item.price;
    item.originalCategory = item.category;
    this.cdr.detectChanges();
  }

  // 💾 Salva modifica menu item
  saveEditMenuItem(item: EditableMenuItem): void {
    if (!item.name.trim() || !item.category.trim() || item.price <= 0) {
      alert('Tutti i campi sono obbligatori e il prezzo deve essere maggiore di 0');
      return;
    }

    item.loading = true;
    this.cdr.detectChanges();

    this.menuItemService.updateMenuItem(item.id, item.name, item.price, item.category).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Menu item aggiornato:', response.menuItem);
          item.editing = false;
          item.loading = false;
          item.originalName = item.name;
          item.originalPrice = item.price;
          item.originalCategory = item.category;
          this.groupMenuItems(); // Riagruppa per categoria
          this.cdr.detectChanges();
        } else {
          alert('Errore: ' + response.message);
          item.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('❌ Errore aggiornamento menu item:', error);
        alert('Errore nell\'aggiornamento del menu item');
        // Ripristina valori originali
        item.name = item.originalName;
        item.price = item.originalPrice;
        item.category = item.originalCategory;
        item.editing = false;
        item.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ❌ Annulla modifica menu item
  cancelEditMenuItem(item: EditableMenuItem): void {
    item.name = item.originalName;
    item.price = item.originalPrice;
    item.category = item.originalCategory;
    item.editing = false;
    item.loading = false;
    this.cdr.detectChanges();
  }

  // 🗑️ Cancella menu item
  deleteMenuItem(item: EditableMenuItem): void {
    if (!confirm(`Sei sicuro di voler cancellare "${item.name}"?`)) return;

    this.menuItemService.deleteMenuItem(item.id).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Menu item cancellato');
          this.loadMenuItems(); // Ricarica lista
        } else {
          alert('Errore: ' + response.message);
        }
      },
      error: (error) => {
        console.error('❌ Errore cancellazione menu item:', error);
        alert('Errore nella cancellazione del menu item');
      }
    });
  }

  // 🎨 Ottieni icona categoria
  getCategoryIcon(category: string): string {
    if (category.includes('🍕') || category.toLowerCase().includes('pizza')) return '🍕';
    if (category.includes('🍝') || category.toLowerCase().includes('primi')) return '🍝';
    if (category.includes('🥩') || category.toLowerCase().includes('secondi')) return '🥩';
    if (category.includes('🥗') || category.toLowerCase().includes('antipasti')) return '🥗';
    if (category.includes('🍷') || category.toLowerCase().includes('vini')) return '🍷';
    if (category.includes('🍺') || category.toLowerCase().includes('birre')) return '🍺';
    if (category.includes('🥤') || category.toLowerCase().includes('bevande')) return '🥤';
    if (category.includes('🍰') || category.toLowerCase().includes('dolci')) return '🍰';
    return '🍽️';
  }

  // 💰 Formatta prezzo
  formatPrice(price: number): string {
    return '€' + price.toFixed(2);
  }

  getPhotoUrl(photo: IPhoto): string {
  return this.photoService.getPhotoUrl(photo);
}
}
