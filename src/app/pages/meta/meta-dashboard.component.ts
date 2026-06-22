import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetaService } from '../../core/services/meta.service';
import { MetaDashboardStats } from '../../models/meta.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-meta-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meta-dashboard.component.html',
  styleUrls: ['./meta-dashboard.component.css', './meta-shared.css'],
})
export class MetaDashboardComponent implements OnInit {
  stats: MetaDashboardStats | null = null;
  isLoading = true;
  readonly metaWebhookUrl = environment.metaWebhookUrl;

  constructor(private metaService: MetaService) {}

  ngOnInit(): void {
    this.metaService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  statusClass(status: string): string {
    return status === 'active' || status === 'connected' ? 'status-ok' : 'status-warn';
  }

  webhookLabel(status: string): string {
    return status === 'active' ? 'Activo' : 'Pendiente';
  }

  connectionLabel(status: string): string {
    return status === 'connected' ? 'Conectado' : 'Desconectado';
  }
}
