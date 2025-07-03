import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from '../../services/restaurant';
import { IRestaurant } from '../../models/i-restaurant';
import { BookingModalComponent } from '../../modals/booking-modal/booking-modal';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule,BookingModalComponent],
  templateUrl: './restaurant-detail.html',
  styleUrls: ['./restaurant-detail.css']
})
export class RestaurantDetailComponent implements OnInit {

  restaurant: IRestaurant | null = null;
  loading = true;
  error: string | null = null;
  restaurantId: number | null = null;

  // Booking modal
  isBookingModalOpen = false;

  // Dati mock per demo (poi verranno dal backend)
  availableDates = [
    { label: 'Oggi', date: new Date(), discount: '-20%' },
    { label: 'Domani', date: new Date(Date.now() + 86400000), discount: '-20%' },
    { label: 'Sab 06 Lug', date: new Date(Date.now() + 2 * 86400000), discount: '-20%' },
    { label: 'Dom 07 Lug', date: new Date(Date.now() + 3 * 86400000), discount: '-20%' }
  ];

  strengthsFromReviews = [
    'Piatti di pesce genuini e freschi',
    'Ospitalità eccezionale e calorosa',
    'Vista panoramica mozzafiato',
    'Ambiente familiare e accogliente'
  ];

  menuHighlights = [
    { name: 'Linguine al polpo "alla luciana"', price: 20 },
    { name: 'Carbonara di mare', price: 18 },
    { name: 'Genovese di mare', price: 18 },
    { name: 'Branzino in crosta di sale', price: 25 }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restaurantService: RestaurantService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.restaurantId = +params['id'];
      if (this.restaurantId) {
        this.loadRestaurantDetail();
      }
    });
  }

  loadRestaurantDetail() {
    if (!this.restaurantId) return;

    this.loading = true;
    this.error = null;

    this.restaurantService.getRestaurantById(this.restaurantId).subscribe({
      next: (data) => {
        console.log('✅ Dettaglio ristorante caricato:', data);
        this.restaurant = data;
        this.loading = false;
        console.log('🔧 DEBUG - loading:', this.loading, 'restaurant:', this.restaurant);
        this.cdr.detectChanges(); // ← FORZA IL REFRESH!
      },
      error: (err) => {
        console.error('❌ Errore caricamento dettaglio:', err);
        this.error = 'Errore nel caricamento del ristorante.';
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }

  toggleFavorite() {
    console.log('💖 Toggle preferito per ristorante:', this.restaurantId);
    // TODO: Implementare logica preferiti
  }

  shareRestaurant() {
    console.log('📤 Condividi ristorante:', this.restaurantId);
    // TODO: Implementare condivisione
  }



  viewFullMenu() {
    console.log('📋 Visualizza menù completo');
    // TODO: Implementare visualizzazione menù completo
  }

  viewAllReviews() {
    console.log('⭐ Visualizza tutte le recensioni');
    // TODO: Implementare visualizzazione recensioni
  }

  getStars(rating: number): string {
    if (!rating || rating === 0) return '⭐';

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    let stars = '⭐'.repeat(fullStars);
    if (hasHalfStar && fullStars < 5) {
      stars += '⭐';
    }

    return stars || '⭐';
  }

  getPriceRange(): string {
    // Mock per ora, poi dal backend
    return '35 €';
  }

  // Apre il modal (dal pulsante principale)
  bookTable() {
    console.log('📅 Prenota tavolo per ristorante:', this.restaurantId);
    this.isBookingModalOpen = true;
  }

  // Apre il modal (da date specifiche o "vedi altre date")
  openBookingModal(selectedDate?: any) {
    console.log('📅 Apri modal prenotazione:', selectedDate ? selectedDate : 'tutte le date');

    // Se è stata selezionata una data specifica, potresti pre-selezionarla nel modal
    if (selectedDate) {
      console.log('📅 Data pre-selezionata:', selectedDate.date);
      // TODO: Passa la data selezionata al modal quando implementiamo questa feature
    }

    this.isBookingModalOpen = true;
  }

  // Chiude il modal
  closeBookingModal() {
    this.isBookingModalOpen = false;
  }

  // Gestisce la conferma prenotazione
  onBookingConfirmed(bookingData: any) {
    console.log('✅ Prenotazione confermata:', bookingData);
    // TODO: Inviare prenotazione al backend
    alert('Prenotazione confermata! 🎉');
    this.closeBookingModal();
  }

  // Funzione esistente selectDate ora richiama openBookingModal
  selectDate(date: any) {
    console.log('📅 Data selezionata:', date);
    this.openBookingModal(date);
  }

}
