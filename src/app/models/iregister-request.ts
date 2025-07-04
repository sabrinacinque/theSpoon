export interface IRegisterRequest {
  // DATI BASE (sempre richiesti)
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'BUSINESS';

  // DATI BUSINESS (opzionali - solo se role = 'BUSINESS')
  businessName?: string;
  phone?: string;
  partitaIva?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;

  // DATI RESTAURANT (opzionali - solo se role = 'BUSINESS')
  restaurantName?: string;
  phoneNumber?: string;
  description?: string;
  cuisineType?: string;
  giornoChiusura?: string;

  // SUBSCRIPTION (opzionale - solo se role = 'BUSINESS')
  subscriptionType?: 'BASIC' | 'GOLD';
}
