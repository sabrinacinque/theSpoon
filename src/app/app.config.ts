import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    // 🎯 ROUTER CON SCROLL CONFIGURATION (CORRETTO)
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',     // ⬆️ Auto-scroll in alto
        anchorScrolling: 'enabled'             // 🔗 Abilita scroll agli anchor
      })
    ),

    provideHttpClient(),

    // 🔐 AUTH INTERCEPTOR
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
};
