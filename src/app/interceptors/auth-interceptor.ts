import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 🔐 Ottieni token dal AuthService
    const token = this.authService.getToken();

    // 🚀 Se c'è un token, aggiungilo all'header Authorization
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });

      console.log('🔗 Token aggiunto alla richiesta:', req.url);
      return next.handle(authReq);
    }

    // ✅ Altrimenti procedi senza token
    return next.handle(req);
  }
}
