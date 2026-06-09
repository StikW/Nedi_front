import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface EvolutionConnectResult {
  instance: string;
  qrBase64?: string;
  pairingCode?: string;
  status: 'connecting' | 'connected';
}

export interface EvolutionConnectionStatus {
  instance: string;
  state: string;
  status: 'connected' | 'connecting' | 'disconnected';
  number?: string;
}

export interface EvolutionLogoutResult {
  instance: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class EvolutionService {
  private readonly baseUrl = `${environment.apiUrl}/agent/evolution`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  connect(): Observable<EvolutionConnectResult> {
    return this.http
      .post<EvolutionConnectResult>(`${this.baseUrl}/connect`, {}, { headers: this.authService.getAuthHeaders() })
      .pipe(catchError((err) => throwError(() => this.mapError(err, 'conectar WhatsApp'))));
  }

  status(): Observable<EvolutionConnectionStatus> {
    return this.http
      .get<EvolutionConnectionStatus>(`${this.baseUrl}/status`, { headers: this.authService.getAuthHeaders() })
      .pipe(catchError((err) => throwError(() => this.mapError(err, 'consultar el estado'))));
  }

  logout(): Observable<EvolutionLogoutResult> {
    return this.http
      .post<EvolutionLogoutResult>(`${this.baseUrl}/logout`, {}, { headers: this.authService.getAuthHeaders() })
      .pipe(catchError((err) => throwError(() => this.mapError(err, 'desconectar WhatsApp'))));
  }

  /** Normaliza el QR de Evolution a data URL para mostrarlo en un img. */
  qrToDataUrl(qr?: string): string | null {
    if (!qr) return null;
    if (qr.startsWith('data:')) return qr;
    return `data:image/png;base64,${qr}`;
  }

  private mapError(error: HttpErrorResponse, action: string): Error {
    if (error.status === 503) {
      return new Error('El servidor de WhatsApp no está configurado. Contacta al administrador.');
    }
    if (error.status === 401) {
      return new Error('Sesión expirada. Vuelve a iniciar sesión.');
    }
    const msg = error.error?.message || error.message;
    return new Error(msg ? `No se pudo ${action}: ${msg}` : `No se pudo ${action}. Intenta de nuevo.`);
  }
}
