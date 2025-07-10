import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

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
  private readonly USER_KEY = 'thespoon_user';

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
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.authStatus.next(false);

    this.router.navigate(['/']);
    console.log('🔓 Logout completato');
  }

  // 👤 PROFILO UTENTE CORRENTE
  getCurrentUserProfile(): Observable<IAuthResponse> {
    const token = this.getToken();
    if (!token) {
      return of({ success: false, message: 'No token found' });
    }

    return this.http.get<any>(`${this.API_URL}/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      tap((response: any) => {
        if (response.success && response.valid) {
          const userData: IUserAuthData = {
            type: 'login',
            token: token,
            userId: response.userId,
            email: response.email,
            firstName: '',
            lastName: '',
            role: response.role
          };
          this.setUserData(userData);
        }
      }),
      map((response: any) => {
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
    return !!token;
  }

  // 🔧 FIX - AGGIUNGI METODO getHeaders()
  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  // 🚀 INIZIALIZZAZIONE
  private initializeAuth(): void {
    const token = this.getToken();

    if (token) {
      this.isAuthenticated.set(true);
      this.authStatus.next(true);
      this.loadUserFromStorage();

      this.getCurrentUserProfile().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.setUserData(response.data);
            console.log('✅ Token verificato, utente autenticato:', response.data.email);
          } else {
            console.log('❌ Token non valido, logout');
            this.logout();
          }
        },
        error: (error) => {
          if (error.status === 401 || error.status === 403) {
            console.log('🔒 Token scaduto/non valido, logout');
            this.logout();
          } else {
            console.log('⚠️ Errore di rete, mantieni autenticazione locale');
          }
        }
      });
    }
  }

  // 🔄 CARICA DATI UTENTE DA LOCALSTORAGE
  private loadUserFromStorage(): void {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        this.currentUser.set(user);
        console.log('📥 Dati utente caricati da localStorage:', user.email);
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento dati utente da localStorage:', error);
    }
  }

  // ✅ SUCCESSO AUTENTICAZIONE
  private handleAuthSuccess(authData: IUserAuthData): void {
    this.setToken(authData.token);

    const userData = {
      userId: authData.userId,
      email: authData.email,
      firstName: authData.firstName,
      lastName: authData.lastName,
      role: authData.role
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
    this.setUserData(authData);
    this.isAuthenticated.set(true);
    this.authStatus.next(true);

    console.log('✅ Autenticazione completata:', authData.email);

    // REDIRECT AUTOMATICO
    if (authData.role === 'BUSINESS') {
      console.log('🏢 Redirect a Business Dashboard per:', authData.email);
      this.router.navigate(['/business-dashboard']);
    } /*else if (authData.role === 'CUSTOMER') {
      console.log('👤 Redirect a Dashboard Customer per:', authData.email);
      this.router.navigate(['/dashboard-customer']);
    } else {
      console.log('🏠 Redirect a Homepage:', authData.role);
      this.router.navigate(['/']);
    }*/
  }

  // 🔄 IMPOSTA DATI UTENTE
  private setUserData(userData: IUserAuthData): void {
    const user: IUser = {
      userId: userData.userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role as 'CUSTOMER' | 'BUSINESS' | 'ADMIN'
    };

    this.currentUser.set(user);
  }

  // 🔄 AGGIORNA DATI PROFILO UTENTE (NUOVO METODO)
  updateUserProfileData(updatedUser: any): void {
    const currentUserData = this.currentUser();
    if (currentUserData) {
      const updatedUserData: IUser = {
        ...currentUserData,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
      };

      // Aggiorna signal
      this.currentUser.set(updatedUserData);

      // Aggiorna localStorage
      localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUserData));

      console.log('✅ AuthService: Dati utente aggiornati:', updatedUserData);
    }
  }

  // 🛡️ UTILITY METHODS
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getUserFullName(): string {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}`.trim() : '';
  }

  getUserEmail(): string {
    const user = this.currentUser();
    return user ? user.email : '';
  }

  getUserId(): number {
    const user = this.currentUser();
    return user ? user.userId : 0;
  }

  getUserPhone(): string {
    const userFromStorage = this.getUserFromStorage();
    return userFromStorage ? (userFromStorage.phoneNumber || userFromStorage.phone || '') : '';
  }

  getCurrentUser(): any {
    return this.getUserFromStorage();
  }

  private getUserFromStorage(): any {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        console.error('Errore parsing user data:', e);
        return null;
      }
    }
    return null;
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

  requireAuth(): boolean {
    if (!this.isLoggedIn()) {
      console.log('🔒 Accesso negato: utente non autenticato');
      return false;
    }
    return true;
  }

  // 🔑 FIX - PASSWORD RESET METHODS
  sendPasswordResetEmail(email: string): Observable<any> {
    console.log('📧 AuthService: Invio email reset password per:', email);

    return this.http.post(`${this.API_URL}/forgot-password`, { email }, {
      headers: this.getHeaders()
    });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    console.log('🔑 AuthService: Reset password con token');

    return this.http.post(`${this.API_URL}/reset-password`, {
      token,
      newPassword
    }, {
      headers: this.getHeaders()
    });
  }
}
