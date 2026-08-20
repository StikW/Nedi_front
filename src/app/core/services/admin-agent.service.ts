import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface InstructorConversationSummary {
  id: string;
  name: string;
  email: string;
  evolutionInstance?: string;
  evolutionNumber?: string;
  evolutionStatus?: string;
  connectionState?: string;
}

export interface ChatSummary {
  remoteJid: string;
  phoneNumber: string;
  pushName?: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  source?: 'evolution' | 'activity_log';
}

export interface ChatMessageView {
  id: string;
  remoteJid: string;
  fromMe: boolean;
  messageType: string;
  text: string;
  timestamp: string;
  pushName?: string;
}

export interface AgentActivityEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  instance: string;
  phoneNumber?: string;
  direction?: 'in' | 'out';
  event: string;
  detail?: string;
  messagePreview?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAgentService {
  private readonly baseUrl = `${environment.apiUrl}/admin/agent`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  listInstructors(): Observable<InstructorConversationSummary[]> {
    return this.http
      .get<InstructorConversationSummary[]>(`${this.baseUrl}/conversations/instructors`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        catchError((err: HttpErrorResponse) =>
          throwError(() => this.mapError(err, 'cargar instructores')),
        ),
      );
  }

  listChats(instructorId: string): Observable<ChatSummary[]> {
    return this.http
      .get<ChatSummary[]>(`${this.baseUrl}/conversations/${instructorId}/chats`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        catchError((err: HttpErrorResponse) =>
          throwError(() => this.mapError(err, 'cargar chats')),
        ),
      );
  }

  listMessages(
    instructorId: string,
    remoteJid: string,
    page = 1,
    offset = 50,
  ): Observable<{ messages: ChatMessageView[]; total?: number; pages?: number; currentPage?: number }> {
    const params = new HttpParams()
      .set('remoteJid', remoteJid)
      .set('page', String(page))
      .set('offset', String(offset));

    return this.http
      .get<{ messages: ChatMessageView[]; total?: number; pages?: number; currentPage?: number }>(
        `${this.baseUrl}/conversations/${instructorId}/messages`,
        { headers: this.authService.getAuthHeaders(), params },
      )
      .pipe(
        catchError((err: HttpErrorResponse) =>
          throwError(() => this.mapError(err, 'cargar mensajes')),
        ),
      );
  }

  listActivity(limit = 100, instance?: string): Observable<{ entries: AgentActivityEntry[] }> {
    let params = new HttpParams().set('limit', String(limit));
    if (instance) params = params.set('instance', instance);

    return this.http
      .get<{ entries: AgentActivityEntry[] }>(`${this.baseUrl}/logs`, {
        headers: this.authService.getAuthHeaders(),
        params,
      })
      .pipe(
        catchError((err: HttpErrorResponse) =>
          throwError(() => this.mapError(err, 'cargar logs')),
        ),
      );
  }

  tailLogFile(lines = 200): Observable<{ file: string | null; lines: string[]; message?: string }> {
    const params = new HttpParams().set('lines', String(lines));
    return this.http
      .get<{ file: string | null; lines: string[]; message?: string }>(`${this.baseUrl}/logs/file`, {
        headers: this.authService.getAuthHeaders(),
        params,
      })
      .pipe(
        catchError((err: HttpErrorResponse) =>
          throwError(() => this.mapError(err, 'leer archivo de log')),
        ),
      );
  }

  private mapError(error: HttpErrorResponse, action: string): Error {
    const body = error.error;
    const msg =
      typeof body === 'string'
        ? body
        : body?.message || error.message;
    return new Error(msg ? `No se pudo ${action}: ${msg}` : `No se pudo ${action}.`);
  }
}
