import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../enviroments/enviroment';

// Import delle interfacce
import { ILoginRequest } from '../models/ilogin-request';
import { IRegisterRequest } from '../models/iregister-request';
import { IAuthResponse } from '../models/iauth-response';
import { IUserAuthData } from '../models/iuser-auth-data';
import { IUser } from '../models/iuser';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'thespoon_token';

  // 🔐 Stato autenticazione con signals
  isAuthenticated = signal<boolean>(false);
  currentUser = signal<IUser | null>(null);

  // 🔄 BehaviorSubject per compatibilità
  private authStatus = new BehaviorSubject<boolean>(this.hasValidToken());
  public authStatus$ = this.authStatus.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // 🚀 Inizializza stato autenticazione al caricamento
    this.initializeAuth();
  }

  // 🔐 LOGIN
  login(email: string, password: string): Observable<IAuthResponse> {
    const loginData: ILoginRequest = { email, password };

    return this.http.post<IAuthResponse>(`${this.API_URL}/login`, loginData).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data);
        }
      }),
      catchError(error => {
        console.error('❌ Errore login:', error);
        return of({
          success: false,
          message: error.error?.message || 'Errore durante il login'
        });
      })
    );
  }

  // 📝 REGISTER
  register(userData: IRegisterRequest): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.API_URL}/register`, userData).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data);
        }
      }),
      catchError(error => {
        console.error('❌ Errore registrazione:', error);
        return of({
          success: false,
          message: error.error?.message || 'Errore durante la registrazione'
        });
      })
    );
  }

  // 🔓 LOGOUT
  logout(): void {
    // Rimuovi token dal localStorage
    localStorage.removeItem(this.TOKEN_KEY);

    // Reset stato
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.authStatus.next(false);

    // Redirect alla homepage
    this.router.navigate(['/']);

    console.log('🔓 Logout completato');
  }

  // 👤 PROFILO UTENTE CORRENTE
  getCurrentUser(): Observable<IAuthResponse> {
    return this.http.get<IAuthResponse>(`${this.API_URL}/me`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.updateUserData(response.data);
        }
      }),
      catchError(error => {
        console.error('❌ Errore recupero profilo:', error);
        this.logout(); // Token non valido, fai logout
        return of({ success: false });
      })
    );
  }

  // 🔧 GESTIONE TOKEN
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    return !!token; // Per ora verifica solo esistenza, JWT validation nel backend
  }

  // 🚀 INIZIALIZZAZIONE
  private initializeAuth(): void {
    if (this.hasValidToken()) {
      // Verifica token con backend
      this.getCurrentUser().subscribe({
        next: (response) => {
          if (!response.success) {
            this.logout(); // Token non valido
          }
        },
        error: () => {
          this.logout(); // Errore, logout
        }
      });
    }
  }

  // ✅ SUCCESSO AUTENTICAZIONE
  private handleAuthSuccess(authData: IUserAuthData): void {
    // Salva token
    this.setToken(authData.token);

    // Aggiorna stato
    this.updateUserData(authData);
    this.isAuthenticated.set(true);
    this.authStatus.next(true);

    console.log('✅ Autenticazione completata:', authData.email);
  }

  // 🔄 AGGIORNA DATI UTENTE
  private updateUserData(userData: IUserAuthData): void {
    const user: IUser = {
      userId: userData.userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role as 'CUSTOMER' | 'BUSINESS' | 'ADMIN'
    };

    this.currentUser.set(user);
  }

  // 🛡️ UTILITY METHODS
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getUserFullName(): string {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  getUserEmail(): string {
    const user = this.currentUser();
    return user ? user.email : '';
  }

  isCustomer(): boolean {
    const user = this.currentUser();
    return user ? user.role === 'CUSTOMER' : false;
  }

  isBusiness(): boolean {
    const user = this.currentUser();
    return user ? user.role === 'BUSINESS' : false;
  }

  isAdmin(): boolean {
    const user = this.currentUser();
    return user ? user.role === 'ADMIN' : false;
  }

  // 🔒 CONTROLLO ACCESSO
  requireAuth(): boolean {
    if (!this.isLoggedIn()) {
      console.log('🔒 Accesso negato: utente non autenticato');
      return false;
    }
    return true;
  }
}
