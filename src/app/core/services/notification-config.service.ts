import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  MetaTemplateOption,
  NotificationConfig,
  NotificationConfigTestResult,
} from '../../models/notification-config.model';

@Injectable({ providedIn: 'root' })
export class NotificationConfigService {
  private readonly apiUrl = `${environment.apiUrl}/admin/notification-config`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  private get headers() {
    return { headers: this.authService.getAuthHeaders() };
  }

  getConfig(): Observable<NotificationConfig> {
    return this.http.get<NotificationConfig>(this.apiUrl, this.headers);
  }

  fetchTemplates(): Observable<MetaTemplateOption[]> {
    return this.http.get<MetaTemplateOption[]>(`${this.apiUrl}/templates`, this.headers);
  }

  updateConfig(data: Partial<NotificationConfig>): Observable<NotificationConfig> {
    return this.http.put<NotificationConfig>(this.apiUrl, data, this.headers);
  }

  testConnection(): Observable<NotificationConfigTestResult> {
    return this.http.post<NotificationConfigTestResult>(
      `${this.apiUrl}/test`,
      {},
      this.headers,
    );
  }
}
