import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../enviroments/enviroment.development';

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

  // 🔓 LOGOUT (aggiornato per pulire anche user data)
  logout(): void {
    // Rimuovi token e dati utente dal localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('thespoon_user');

    // Reset stato
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.authStatus.next(false);

    // Redirect alla homepage
    this.router.navigate(['/']);

    console.log('🔓 Logout completato');
  }

  // 👤 PROFILO UTENTE CORRENTE (usa endpoint /verify invece di /me)
  getCurrentUser(): Observable<IAuthResponse> {
    const token = this.getToken();
    if (!token) {
      return of({ success: false, message: 'No token found' });
    }

    // Usa endpoint /verify che funziona con Authorization header
    return this.http.get<any>(`${this.API_URL}/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      tap((response: any) => {
        if (response.success && response.valid) {
          // Converte la risposta di /verify nel formato atteso
          const userData: IUserAuthData = {
            type: 'login', // Aggiungi il campo type richiesto
            token: token,
            userId: response.userId,
            email: response.email,
            firstName: '', // Non disponibile in /verify
            lastName: '',  // Non disponibile in /verify
            role: response.role
          };
          this.updateUserData(userData);
        }
      }),
      map((response: any) => {
        // Converte la risposta nel formato IAuthResponse
        if (response.success && response.valid) {
          return {
            success: true,
            data: {
              type: 'login',
              token: token,
              userId: response.userId,
              email: response.email,
              firstName: '',
              lastName: '',
              role: response.role
            }
          };
        } else {
          return { success: false, message: 'Token not valid' };
        }
      }),
      catchError(error => {
        console.error('❌ Errore recupero profilo:', error);
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

  // 🚀 INIZIALIZZAZIONE MIGLIORATA
  private initializeAuth(): void {
    const token = this.getToken();

    if (token) {
      // Imposta subito lo stato come autenticato (ottimistico)
      this.isAuthenticated.set(true);
      this.authStatus.next(true);

      // Carica dati utente da localStorage se disponibili
      this.loadUserFromStorage();

      // Poi verifica in background con il backend
      this.getCurrentUser().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Token valido, aggiorna dati utente
            this.updateUserData(response.data);
            console.log('✅ Token verificato, utente autenticato:', response.data.email);
          } else {
            // Token non valido, logout
            console.log('❌ Token non valido, logout');
            this.logout();
          }
        },
        error: (error) => {
          // Solo se è un errore 401/403, fai logout
          if (error.status === 401 || error.status === 403) {
            console.log('🔒 Token scaduto/non valido, logout');
            this.logout();
          } else {
            // Altri errori (rete, server): mantieni autenticazione
            console.log('⚠️ Errore di rete, mantieni autenticazione locale');
          }
        }
      });
    }
  }

  // 🔄 CARICA DATI UTENTE DA LOCALSTORAGE (nuovo metodo)
  private loadUserFromStorage(): void {
    try {
      const userData = localStorage.getItem('thespoon_user');
      if (userData) {
        const user = JSON.parse(userData);
        this.currentUser.set(user);
        console.log('📥 Dati utente caricati da localStorage:', user.email);
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento dati utente da localStorage:', error);
    }
  }

  // ✅ SUCCESSO AUTENTICAZIONE (aggiornato per salvare anche user data)
  private handleAuthSuccess(authData: IUserAuthData): void {
    // Salva token
    this.setToken(authData.token);

    // Salva dati utente in localStorage
    const userData = {
      userId: authData.userId,
      email: authData.email,
      firstName: authData.firstName,
      lastName: authData.lastName,
      role: authData.role
    };
    localStorage.setItem('thespoon_user', JSON.stringify(userData));

    // Aggiorna stato
    this.updateUserData(authData);
    this.isAuthenticated.set(true);
    this.authStatus.next(true);

    console.log('✅ Autenticazione completata:', authData.email);

    // 🚀 REDIRECT AUTOMATICO POST-LOGIN/REGISTRAZIONE
    if (authData.role === 'BUSINESS') {
      console.log('🏢 Redirect a Business Dashboard per:', authData.email);
      this.router.navigate(['/business-dashboard']);
    } else if (authData.role === 'CUSTOMER') {
      console.log('👤 Redirect a Homepage per Customer:', authData.email);
      this.router.navigate(['/']);
    } else {
      // Fallback per ruoli non riconosciuti
      console.log('🏠 Redirect a Homepage (ruolo non riconosciuto):', authData.role);
      this.router.navigate(['/']);
    }
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
