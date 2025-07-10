// services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IUser } from '../models/iuser';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly API_URL = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  // 📋 GET - Tutti gli utenti
  getAllUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(this.API_URL);
  }

  // 👤 GET - Utente per ID
  getUserById(id: number): Observable<IUser> {
    return this.http.get<IUser>(`${this.API_URL}/${id}`);
  }

  // 📧 GET - Utente per email
  getUserByEmail(email: string): Observable<IUser> {
    return this.http.get<IUser>(`${this.API_URL}/email/${email}`);
  }

  // ✅ GET - Verifica se email esiste
  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.API_URL}/check-email/${email}`);
  }

  // 🏢 GET - Tutti gli utenti business
  getAllBusinessUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(`${this.API_URL}/business`);
  }

  // 👥 GET - Tutti i clienti
  getAllCustomers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(`${this.API_URL}/customers`);
  }

  // ✏️ PUT - Aggiorna profilo utente
  updateProfile(userId: number, firstName: string, lastName: string): Observable<IUser> {
    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim()
    };

    console.log('🔄 UserService: Aggiornamento profilo per ID', userId, ':', updateData);

    return this.http.put<IUser>(`${this.API_URL}/${userId}/profile`, updateData);
  }

  // 🔑 PUT - Cambia password
  changePassword(userId: number, currentPassword: string, newPassword: string): Observable<any> {
    const passwordData = {
      currentPassword,
      newPassword
    };

    console.log('🔑 UserService: Cambio password per ID', userId);

    return this.http.put(`${this.API_URL}/${userId}/password`, passwordData);
  }

  // 🗑️ DELETE - Elimina account
  deleteAccount(userId: number, password: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      body: { password }
    };

    console.log('🗑️ UserService: Eliminazione account per ID', userId);

    return this.http.delete(`${this.API_URL}/${userId}`, options);
  }

  // ➕ POST - Registra nuovo business
  registerBusiness(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Observable<IUser> {
    console.log('📝 UserService: Registrazione business:', userData.email);

    return this.http.post<IUser>(`${this.API_URL}/register/business`, userData);
  }

  // 🔧 UTILITY METHODS

  // 📝 Valida email
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 📝 Valida password
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push('La password deve essere di almeno 6 caratteri');
    }

    if (!/[A-Za-z]/.test(password)) {
      errors.push('La password deve contenere almeno una lettera');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('La password deve contenere almeno un numero');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 📝 Valida nome/cognome
  validateName(name: string): boolean {
    return typeof name === 'string' && name.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim());
  }

  // 📝 Formatta nome per display
  formatDisplayName(firstName?: string, lastName?: string): string {
    if (!firstName && !lastName) return 'Utente';
    if (!firstName) return lastName || 'Utente';
    if (!lastName) return firstName;
    return `${firstName} ${lastName}`;
  }

  // 📝 Ottieni iniziali utente
  getUserInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0).toUpperCase() || '';
    const last = lastName?.charAt(0).toUpperCase() || '';
    return first + last || 'U';
  }

  // 📊 Formatta ruolo per display
  formatRole(role: string): string {
    const roles: { [key: string]: string } = {
      'CUSTOMER': 'Cliente',
      'BUSINESS': 'Azienda',
      'ADMIN': 'Amministratore'
    };
    return roles[role] || role;
  }

  // 🎨 Ottieni colore per ruolo
  getRoleColor(role: string): string {
    const colors: { [key: string]: string } = {
      'CUSTOMER': '#28a745',
      'BUSINESS': '#007bff',
      'ADMIN': '#dc3545'
    };
    return colors[role] || '#6c757d';
  }

  // 📋 Crea oggetto utente vuoto
  createEmptyUser(): IUser {
    return {
      userId: 0,
      email: '',
      firstName: '',
      lastName: '',
      role: 'CUSTOMER'
    };
  }

  // 🔄 Clona utente (deep copy)
  cloneUser(user: IUser): IUser {
    return {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
  }

  // 📊 Statistiche utente (placeholder - da implementare con API dedicate)
  getUserStats(userId: number): Observable<{
    totalReservations: number;
    completedReservations: number;
    cancelledReservations: number;
    favoriteRestaurants: number;
    memberSince: string;
  }> {
    // Per ora ritorna dati mock, in futuro sarà una vera API
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          totalReservations: 0,
          completedReservations: 0,
          cancelledReservations: 0,
          favoriteRestaurants: 0,
          memberSince: '2024'
        });
        observer.complete();
      }, 500);
    });
  }

  // 🔐 Verifica se l'utente può modificare un campo
  canEditField(fieldName: string, userRole: string): boolean {
    const editableFields: { [role: string]: string[] } = {
      'CUSTOMER': ['firstName', 'lastName'],
      'BUSINESS': ['firstName', 'lastName'],
      'ADMIN': ['firstName', 'lastName', 'email', 'role']
    };

    return editableFields[userRole]?.includes(fieldName) || false;
  }

  // 📧 Invia email di verifica (placeholder)
  sendVerificationEmail(userId: number): Observable<any> {
    console.log('📧 UserService: Invio email verifica per ID', userId);
    return this.http.post(`${this.API_URL}/${userId}/verify-email`, {});
  }

  // 🔄 Reset password (placeholder)
  resetPassword(email: string): Observable<any> {
    console.log('🔄 UserService: Reset password per email', email);
    return this.http.post(`${this.API_URL}/reset-password`, { email });
  }
}
