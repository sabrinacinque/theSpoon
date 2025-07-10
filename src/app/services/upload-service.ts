// upload.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private baseUrl = `${environment.apiUrl}/upload`;

  constructor(private http: HttpClient) { }

  // 🔄 UPLOAD VERO AL SERVER
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.baseUrl}/image`, formData);
  }

  // 🔄 GESTISCE IMMAGINI CARICATE SUL SERVER
  getImageUrl(filename: string): string {
    if (!filename) return 'assets/placeholder.jpg';

    // Se il filename contiene un UUID (immagini caricate sul server)
    if (this.isServerUploadedImage(filename)) {
      return `${environment.apiUrl}/upload/images/${filename}`;
    }

    // Fallback per immagini esistenti
    return `assets/images/${filename}`;
  }

  // Verifica se è un'immagine caricata sul server (contiene UUID)
  private isServerUploadedImage(filename: string): boolean {
    // UUID pattern: 8-4-4-4-12 caratteri esadecimali + estensione
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i;
    return uuidPattern.test(filename);
  }

  // 🗑️ ELIMINA IMMAGINE DAL SERVER
  deleteImage(filename: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/images/${filename}`);
  }
}
