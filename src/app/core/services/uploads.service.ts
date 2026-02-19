import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
}

export interface ModulePresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class UploadsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Obtiene una URL pre-firmada para subir un archivo a S3
   * @param courseId ID del curso
   * @param filename Nombre del archivo
   * @param contentType Tipo de contenido del archivo
   * @returns Observable con la URL pre-firmada y la clave del archivo
   */
  getPresignedUrl(courseId: string, filename: string, contentType: string): Observable<PresignedUrlResponse> {
    const url = `${this.baseUrl}/uploads/presigned-url`;
    const body = {
      courseId,
      filename,
      contentType
    };

    return this.http.post<PresignedUrlResponse>(url, body, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene una URL pre-firmada para subir recursos de módulos a S3
   * @param courseId ID del curso
   * @param moduleId ID del módulo
   * @param filename Nombre del archivo
   * @param contentType Tipo de contenido del archivo
   * @returns Observable con la URL pre-firmada y la clave del archivo
   */
  getModulePresignedUrl(courseId: string, moduleId: string, filename: string, contentType: string): Observable<ModulePresignedUrlResponse> {
    const url = `${this.baseUrl}/uploads/module/presigned-url`;
    const body = {
      courseId,
      moduleId,
      filename,
      contentType
    };

    return this.http.post<ModulePresignedUrlResponse>(url, body, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Sube un archivo a S3 usando una URL pre-firmada
   * @param uploadUrl URL pre-firmada para la subida
   * @param file Archivo a subir
   * @param contentType Tipo de contenido del archivo
   * @returns Observable con el progreso de la subida
   */
  uploadFile(uploadUrl: string, file: File, contentType: string): Observable<UploadProgress> {
    const headers = new HttpHeaders({
      'Content-Type': contentType
    });

    return this.http.put(uploadUrl, file, {
      headers,
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const progress = event as any;
            return {
              loaded: progress.loaded,
              total: progress.total,
              percentage: progress.total ? Math.round((progress.loaded * 100) / progress.total) : 0
            };
          case HttpEventType.Response:
            return {
              loaded: 100,
              total: 100,
              percentage: 100
            };
          default:
            return {
              loaded: 0,
              total: 0,
              percentage: 0
            };
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene una URL pre-firmada para descargar un archivo desde S3
   * @param courseId ID del curso
   * @param fileKey Clave del archivo en S3
   * @returns Observable con la URL pre-firmada de descarga
   */
  getDownloadUrl(courseId: string, fileKey: string): Observable<{ downloadUrl: string }> {
    const url = `${this.baseUrl}/uploads/${courseId}/${fileKey}`;

    return this.http.get<{ downloadUrl: string }>(url, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Método completo para subir un archivo: obtiene la URL pre-firmada y sube el archivo
   * @param courseId ID del curso
   * @param file Archivo a subir
   * @returns Observable con el progreso de la subida y la clave del archivo
   */
  uploadFileWithPresignedUrl(courseId: string, file: File): Observable<{ progress: UploadProgress; fileKey?: string }> {
    return this.getPresignedUrl(courseId, file.name, file.type).pipe(
      switchMap(response => {
        return this.uploadFile(response.uploadUrl, file, file.type).pipe(
          map(progress => ({ progress, fileKey: response.fileKey }))
        );
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Método completo para subir recursos de módulos: obtiene la URL pre-firmada y sube el archivo
   * @param courseId ID del curso
   * @param moduleId ID del módulo
   * @param file Archivo a subir
   * @returns Observable con el progreso de la subida y la clave del archivo
   */
  uploadModuleFileWithPresignedUrl(courseId: string, moduleId: string, file: File): Observable<{ progress: UploadProgress; fileKey?: string }> {
    return this.getModulePresignedUrl(courseId, moduleId, file.name, file.type).pipe(
      switchMap(response => {
        return this.uploadFile(response.uploadUrl, file, file.type).pipe(
          map(progress => ({ progress, fileKey: response.fileKey }))
        );
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Confirma la subida de un archivo de módulo
   * @param courseId ID del curso
   * @param moduleId ID del módulo
   * @returns Observable con el resultado de la confirmación
   */
  confirmModuleFileUpload(courseId: string, moduleId: string): Observable<{ success: boolean; message?: string }> {
    const url = `${this.baseUrl}/uploads/module/trigger-vectorization`;
    const body = {
      courseId,
      moduleId
    };
    return this.http.post<{ success: boolean; message?: string }>(url, body, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene la URL de descarga de un archivo de módulo a través del endpoint del backend
   * @param courseId ID del curso
   * @param moduleId ID del módulo
   * @param fileKey Clave del archivo en S3
   * @returns Observable con la URL de descarga
   */
  downloadModuleFile(courseId: string, moduleId: string, fileKey: string): Observable<{ downloadUrl: string }> {
    const url = `${this.baseUrl}/uploads/module/${courseId}/${moduleId}/${fileKey}`;
    
    return this.http.get<{ downloadUrl: string }>(url, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Maneja errores HTTP
   * @param error Error HTTP
   * @returns Observable con el error
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }
    
    console.error('Error en UploadsService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
