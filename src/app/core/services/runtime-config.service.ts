import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RuntimePublicConfig {
  s3ResourcesPublicBaseUrl: string;
  s3ModulesPublicBaseUrl: string;
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private config: RuntimePublicConfig | null = null;

  constructor(private http: HttpClient) {}

  async load(): Promise<void> {
    this.config = await firstValueFrom(
      this.http.get<RuntimePublicConfig>(`${environment.apiUrl}/config/public`),
    );
  }

  getS3ResourcesBaseUrl(): string {
    if (!this.config?.s3ResourcesPublicBaseUrl) {
      throw new Error('Missing runtime config: s3ResourcesPublicBaseUrl');
    }
    return this.config.s3ResourcesPublicBaseUrl;
  }

  getS3ModulesBaseUrl(): string {
    if (!this.config?.s3ModulesPublicBaseUrl) {
      throw new Error('Missing runtime config: s3ModulesPublicBaseUrl');
    }
    return this.config.s3ModulesPublicBaseUrl;
  }
}

