import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetaService } from '../../core/services/meta.service';
import { MetaApiConfig } from '../../models/meta.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-meta-api-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meta-api-config.component.html',
  styleUrls: ['./meta-shared.css'],
})
export class MetaApiConfigComponent implements OnInit {
  config: MetaApiConfig = {};
  isLoading = true;
  isSaving = false;
  isTesting = false;
  saved = false;
  testResult: { connected: boolean; phoneNumber?: string; error?: string } | null = null;

  /** URL de producción en tututor.co para registrar en Meta Developers. */
  readonly webhookUrl = environment.metaWebhookUrl;

  constructor(private metaService: MetaService) {}

  ngOnInit(): void {
    this.metaService.getApiConfig().subscribe({
      next: (c) => { this.config = { ...c }; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  save(): void {
    this.isSaving = true;
    this.saved = false;
    this.metaService.updateApiConfig(this.config).subscribe({
      next: (c) => {
        this.config = c;
        this.isSaving = false;
        this.saved = true;
        setTimeout(() => (this.saved = false), 3000);
      },
      error: () => { this.isSaving = false; },
    });
  }

  testConnection(): void {
    this.isTesting = true;
    this.testResult = null;
    this.metaService.testConnection().subscribe({
      next: (r) => {
        this.testResult = r;
        this.isTesting = false;
      },
      error: (err) => {
        this.testResult = { connected: false, error: err?.message || 'Error de conexión' };
        this.isTesting = false;
      },
    });
  }
}
