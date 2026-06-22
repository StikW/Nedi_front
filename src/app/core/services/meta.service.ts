import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  MetaContact,
  MetaTemplate,
  MetaApiConfig,
  MetaDashboardStats,
  MetaConversation,
  MetaChatMessage,
  MetaWebhookEvent,
  MetaLogEntry,
} from '../../models/meta.model';

@Injectable({ providedIn: 'root' })
export class MetaService {
  private readonly apiUrl = `${environment.apiUrl}/meta`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  private get headers() {
    return { headers: this.authService.getAuthHeaders() };
  }

  getDashboardStats(): Observable<MetaDashboardStats> {
    return this.http.get<MetaDashboardStats>(`${this.apiUrl}/dashboard/stats`, this.headers);
  }

  // Contactos
  getContacts(): Observable<MetaContact[]> {
    return this.http.get<MetaContact[]>(`${this.apiUrl}/contacts`, this.headers);
  }

  createContact(data: Partial<MetaContact>): Observable<MetaContact> {
    return this.http.post<MetaContact>(`${this.apiUrl}/contacts`, data, this.headers);
  }

  updateContact(id: string, data: Partial<MetaContact>): Observable<MetaContact> {
    return this.http.put<MetaContact>(`${this.apiUrl}/contacts/${id}`, data, this.headers);
  }

  deleteContact(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/contacts/${id}`, this.headers);
  }

  // Plantillas
  getTemplates(): Observable<MetaTemplate[]> {
    return this.http.get<MetaTemplate[]>(`${this.apiUrl}/templates`, this.headers);
  }

  createTemplate(data: Partial<MetaTemplate>): Observable<MetaTemplate> {
    return this.http.post<MetaTemplate>(`${this.apiUrl}/templates`, data, this.headers);
  }

  updateTemplate(id: string, data: Partial<MetaTemplate>): Observable<MetaTemplate> {
    return this.http.put<MetaTemplate>(`${this.apiUrl}/templates/${id}`, data, this.headers);
  }

  deleteTemplate(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/templates/${id}`, this.headers);
  }

  syncTemplatesFromMeta(): Observable<{ synced: number; templates: MetaTemplate[] }> {
    return this.http.post<{ synced: number; templates: MetaTemplate[] }>(
      `${this.apiUrl}/templates/sync`,
      {},
      this.headers,
    );
  }

  // Mensajes
  sendMessage(payload: {
    contactId: string;
    templateId: string;
    variables?: Record<string, string>;
  }): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/messages/send`, payload, this.headers);
  }

  // Conversaciones
  getConversations(): Observable<MetaConversation[]> {
    return this.http.get<MetaConversation[]>(`${this.apiUrl}/conversations`, this.headers);
  }

  getConversationMessages(conversationId: string): Observable<{ conversationId: string; messages: MetaChatMessage[] }> {
    return this.http.get<{ conversationId: string; messages: MetaChatMessage[] }>(
      `${this.apiUrl}/conversations/${conversationId}/messages`,
      this.headers,
    );
  }

  // Webhooks
  getWebhookEvents(): Observable<MetaWebhookEvent[]> {
    return this.http.get<MetaWebhookEvent[]>(`${this.apiUrl}/webhooks/events`, this.headers);
  }

  // Config API
  getApiConfig(): Observable<MetaApiConfig> {
    return this.http.get<MetaApiConfig>(`${this.apiUrl}/api-config`, this.headers);
  }

  updateApiConfig(data: Partial<MetaApiConfig>): Observable<MetaApiConfig> {
    return this.http.put<MetaApiConfig>(`${this.apiUrl}/api-config`, data, this.headers);
  }

  testConnection(): Observable<{ connected: boolean; phoneNumber?: string; error?: string }> {
    return this.http.post<{ connected: boolean; phoneNumber?: string; error?: string }>(
      `${this.apiUrl}/api-config/test`,
      {},
      this.headers,
    );
  }

  // Logs
  getLogs(): Observable<MetaLogEntry[]> {
    return this.http.get<MetaLogEntry[]>(`${this.apiUrl}/logs`, this.headers);
  }
}
