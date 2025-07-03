import { IBusiness } from './i-business';
import { IPhoto } from './i-photo';
import { IReview } from './i-review';

export interface IRestaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  phoneNumber: string;
  partitaIva: string;
  cuisineType: string;
  giornoChiusura: string; // LUN, MAR, MER, GIO, VEN, SAB, DOM, NESSUNO
  createdAt: string;
  updatedAt: string;

  // Campi calcolati dal backend
  available?: boolean;      // true = "Aperto", false = "Giorno di chiusura"
  rating?: number;
  reviewCount?: number;

  // Info business
  businessName?: string;
  businessEmail?: string;

  // Relazioni (se necessarie)
  business?: IBusiness;
  photos?: IPhoto[];
  reviews?: IReview[];
}
