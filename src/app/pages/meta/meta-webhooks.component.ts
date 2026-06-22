import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetaService } from '../../core/services/meta.service';
import { MetaWebhookEvent } from '../../models/meta.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-meta-webhooks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meta-webhooks.component.html',
  styleUrls: ['./meta-webhooks.component.css', './meta-shared.css'],
})
export class MetaWebhooksComponent implements OnInit {
  events: MetaWebhookEvent[] = [];
  isLoading = true;
  readonly metaWebhookUrl = environment.metaWebhookUrl;

  constructor(private metaService: MetaService) {}

  ngOnInit(): void {
    this.metaService.getWebhookEvents().subscribe({
      next: (e) => { this.events = e; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  eventLabel(type: string): string {
    if (type === 'message.received') return 'Mensaje recibido';
    if (type === 'message.status') return 'Estado de mensaje';
    return type;
  }
}
