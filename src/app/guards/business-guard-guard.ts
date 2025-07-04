import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const businessGuardGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 🔍 Verifica autenticazione
  if (!authService.isLoggedIn()) {
    // ❌ Non autenticato non può accedere alla dashboard
    console.log('❌ Accesso negato: utente non autenticato → redirect homepage');
    router.navigate(['/']);
    return false;
  }

  // 🔍 Verifica ruolo business
  if (authService.isBusiness()) {
    // ✅ Business può accedere alla dashboard
    console.log('🏢 Business accesso alla dashboard consentito');
    return true;
  }

  if (authService.isCustomer()) {
    // ❌ Customer non può accedere alla dashboard business
    console.log('👤 Customer bloccato dalla dashboard → redirect homepage');
    router.navigate(['/']);
    return false;
  }

  // ❌ Ruolo non riconosciuto
  console.log('❓ Ruolo non riconosciuto → redirect homepage');
  router.navigate(['/']);
  return false;
};
