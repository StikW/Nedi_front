import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetaService } from '../../core/services/meta.service';
import { MetaLogEntry } from '../../models/meta.model';

@Component({
  selector: 'app-meta-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meta-logs.component.html',
  styleUrls: ['./meta-logs.component.css', './meta-shared.css'],
})
export class MetaLogsComponent implements OnInit {
  logs: MetaLogEntry[] = [];
  isLoading = true;

  constructor(private metaService: MetaService) {}

  ngOnInit(): void {
    this.metaService.getLogs().subscribe({
      next: (l) => { this.logs = l; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  statusClass(status: number): string {
    if (status >= 200 && status < 300) return 'status-ok';
    if (status >= 400) return 'status-error';
    return '';
  }
}
