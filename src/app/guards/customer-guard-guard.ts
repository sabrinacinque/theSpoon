import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const customerGuardGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 🔍 Verifica stato autenticazione
  if (!authService.isLoggedIn()) {
    // ✅ Guest può accedere alla homepage
    console.log('👤 Guest accesso alla homepage consentito');
    return true;
  }

  // 🔍 Verifica ruolo utente
  if (authService.isCustomer()) {
    // ✅ Customer può accedere alla homepage
    console.log('👤 Customer accesso alla homepage consentito');
    return true;
  }

  if (authService.isBusiness()) {
    // ❌ Business non può accedere alla homepage
    console.log('🏢 Business bloccato dalla homepage → redirect a dashboard');
    router.navigate(['/business-dashboard']);
    return false;
  }

  // ❌ Ruolo non riconosciuto, ma consenti l'accesso (fallback sicuro)
  console.log('❓ Ruolo non riconosciuto, accesso homepage consentito');
  return true;
};
