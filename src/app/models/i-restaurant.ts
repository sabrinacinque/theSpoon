import { IBusiness } from './i-business';
import { IPhoto } from './i-photo';
import { IReview } from './i-review';

export interface IRestaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  province: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  cuisineType: string;
  priceRange: string;
  partitaIva: string;
  capacityLunch: number;
  capacityDinner: number;
  openingTime: string;
  closingTime: string;
  closedDays?: string;
  business: IBusiness;
  photos: IPhoto[];
  reviews: IReview[];
  // Campi calcolati per il frontend
  rating?: number;
  reviewCount?: number;
  available?: boolean;
}
