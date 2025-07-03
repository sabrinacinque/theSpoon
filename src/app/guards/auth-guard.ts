import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {

    // 🔐 Verifica se l'utente è autenticato
    if (this.authService.isLoggedIn()) {
      console.log('✅ Guard: Accesso consentito');
      return true;
    }

    // ❌ Non autenticato - redirect al login
    console.log('🔒 Guard: Accesso negato, redirect al login');

    // Salva l'URL richiesto per redirectare dopo login
    const returnUrl = state.url;
    this.router.navigate(['/'], {
      queryParams: {
        returnUrl: returnUrl,
        loginRequired: true
      }
    });

    return false;
  }
}
