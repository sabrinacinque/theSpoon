// menu-item.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

export interface IMenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  restaurant: any;
}

export interface MenuApiResponse {
  success: boolean;
  message: string;
  menuItem?: IMenuItem;
}

@Injectable({
  providedIn: 'root'
})
export class MenuItemService {

  private readonly API_URL = `${environment.apiUrl}/menu-items`;

  constructor(private http: HttpClient) { }

  // 🍽️ Ottieni tutti i menu items di un ristorante
  getMenuItemsByRestaurant(restaurantId: number): Observable<IMenuItem[]> {
    return this.http.get<IMenuItem[]>(`${this.API_URL}/restaurant/${restaurantId}`);
  }

  // 📋 Ottieni menu items per categoria
  getMenuItemsByCategory(restaurantId: number, category: string): Observable<IMenuItem[]> {
    return this.http.get<IMenuItem[]>(`${this.API_URL}/restaurant/${restaurantId}/category/${category}`);
  }

  // 🏷️ Ottieni tutte le categorie
  getCategories(restaurantId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/restaurant/${restaurantId}/categories`);
  }

  // 📊 Ottieni menu raggruppato per categoria
  getMenuGrouped(restaurantId: number): Observable<{[key: string]: IMenuItem[]}> {
    return this.http.get<{[key: string]: IMenuItem[]}>(`${this.API_URL}/restaurant/${restaurantId}/grouped`);
  }

  // ➕ Aggiungi nuovo menu item
  createMenuItem(restaurantId: number, name: string, price: number, category: string): Observable<MenuApiResponse> {
    return this.http.post<MenuApiResponse>(`${this.API_URL}/restaurant/${restaurantId}`, {
      name,
      price,
      category
    });
  }

  // 🔄 Aggiorna menu item
  updateMenuItem(menuItemId: number, name?: string, price?: number, category?: string): Observable<MenuApiResponse> {
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (category !== undefined) updateData.category = category;

    return this.http.put<MenuApiResponse>(`${this.API_URL}/${menuItemId}`, updateData);
  }

  // 🗑️ Cancella menu item
  deleteMenuItem(menuItemId: number): Observable<MenuApiResponse> {
    return this.http.delete<MenuApiResponse>(`${this.API_URL}/${menuItemId}`);
  }

  // 🔍 Cerca menu items
  searchMenuItems(restaurantId: number, searchTerm: string): Observable<IMenuItem[]> {
    return this.http.get<IMenuItem[]>(`${this.API_URL}/restaurant/${restaurantId}/search?q=${searchTerm}`);
  }

  // 📊 Conta menu items
  countMenuItems(restaurantId: number): Observable<{count: number, restaurantId: number}> {
    return this.http.get<{count: number, restaurantId: number}>(`${this.API_URL}/restaurant/${restaurantId}/count`);
  }

  // 🏷️ Categorie predefinite con emoji
  getDefaultCategories(): string[] {
    return [
      '🍕 Pizze',
      '🍝 Primi Piatti',
      '🥩 Secondi Piatti',
      '🥗 Antipasti',
      '🥗 Contorni',
      '🧀 Formaggi',
      '🍷 Vini Rossi',
      '🍷 Vini Bianchi',
      '🥂 Bollicine',
      '🍺 Birre',
      '🥤 Bevande',
      '☕ Caffè',
      '🍰 Dolci',
      '🍨 Gelati',
      '🍫 Dessert',
      '🌟 Specialità della Casa',
      '🌱 Piatti Vegetariani',
      '🌿 Piatti Vegani',
      '🍕 Pizza al Taglio',
      '🍔 Panini',
      '🥪 Tramezzini',
      '🍲 Zuppe',
      '🐟 Pesce',
      '🦐 Crudo',
      '🍜 Pasta Fresca'
    ];
  }
}
