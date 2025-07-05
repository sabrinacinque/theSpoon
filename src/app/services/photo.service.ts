import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';
import { UploadService } from './upload-service';

export interface IPhoto {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  isMain: boolean;
  restaurant: any;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  photo?: IPhoto;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  private readonly API_URL = `${environment.apiUrl}/photos`;

  constructor(
    private http: HttpClient,
    private uploadService: UploadService
  ) { }

  // 📸 Ottieni tutte le foto di un ristorante
  getPhotosByRestaurant(restaurantId: number): Observable<IPhoto[]> {
    return this.http.get<IPhoto[]>(`${this.API_URL}/restaurant/${restaurantId}`);
  }

  // 🖼️ Ottieni foto principale
  getMainPhoto(restaurantId: number): Observable<IPhoto> {
    return this.http.get<IPhoto>(`${this.API_URL}/restaurant/${restaurantId}/main`);
  }

  // 📷 Ottieni foto secondarie
  getSecondaryPhotos(restaurantId: number): Observable<IPhoto[]> {
    return this.http.get<IPhoto[]>(`${this.API_URL}/restaurant/${restaurantId}/secondary`);
  }

  // ➕ Carica nuova foto (usa UploadService + salva info)
  uploadPhoto(restaurantId: number, file: File, isMain: boolean = false): Observable<ApiResponse> {
    // Prima carica la foto tramite UploadService
    return new Observable(observer => {
      this.uploadService.uploadImage(file).subscribe({
        next: (uploadResponse) => {
          if (uploadResponse.success) {
            // Poi salva le info nel database
            this.savePhotoInfo(restaurantId, uploadResponse.filename, uploadResponse.size, file.type, isMain).subscribe({
              next: (saveResponse) => {
                observer.next({
                  success: true,
                  message: 'Foto caricata con successo',
                  photo: saveResponse.photo
                });
                observer.complete();
              },
              error: (error) => {
                observer.error(error);
              }
            });
          } else {
            observer.error(uploadResponse);
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  // 💾 Salva info foto nel database
  private savePhotoInfo(restaurantId: number, filename: string, fileSize: number, contentType: string, isMain: boolean): Observable<any> {
    return this.http.post(`${this.API_URL}/restaurant/${restaurantId}/save`, {
      filename,
      fileSize,
      contentType,
      isMain
    });
  }

  // 🎯 Imposta foto principale
  setMainPhoto(photoId: number, restaurantId: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.API_URL}/${photoId}/set-main?restaurantId=${restaurantId}`, {});
  }

  // 🗑️ Cancella foto
  deletePhoto(photoId: number): Observable<ApiResponse> {
    // Prima cancella dal database
    return new Observable(observer => {
      this.http.delete<ApiResponse>(`${this.API_URL}/${photoId}`).subscribe({
        next: (response) => {
          observer.next(response);
          observer.complete();
          // TODO: Cancellare anche il file fisico tramite UploadService se necessario
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  // 📊 Conta foto
  countPhotos(restaurantId: number): Observable<{count: number, restaurantId: number}> {
    return this.http.get<{count: number, restaurantId: number}>(`${this.API_URL}/restaurant/${restaurantId}/count`);
  }

  // 🖼️ Ottieni URL foto (usa UploadService)
  getPhotoUrl(photo: IPhoto): string {
    return this.uploadService.getImageUrl(photo.fileName);
  }
}
