import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetaService } from '../../core/services/meta.service';
import { MetaTemplate } from '../../models/meta.model';

@Component({
  selector: 'app-meta-templates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meta-templates.component.html',
  styleUrls: ['./meta-shared.css'],
})
export class MetaTemplatesComponent implements OnInit {
  templates: MetaTemplate[] = [];
  isLoading = true;
  isSyncing = false;
  syncMessage = '';
  showModal = false;
  editing: MetaTemplate | null = null;
  toast = '';

  form: Partial<MetaTemplate> = this.emptyForm();

  constructor(private metaService: MetaService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.metaService.getTemplates().subscribe({
      next: (t) => { this.templates = t; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  syncFromMeta(): void {
    this.isSyncing = true;
    this.syncMessage = '';
    this.metaService.syncTemplatesFromMeta().subscribe({
      next: (res) => {
        this.syncMessage = `${res.synced} plantilla(s) sincronizada(s) desde Meta`;
        this.isSyncing = false;
        this.load();
      },
      error: (err) => {
        this.syncMessage = err?.error?.message || 'Error al sincronizar. Verifica Configuración API.';
        this.isSyncing = false;
      },
    });
  }

  openCreate(): void {
    this.editing = null;
    this.form = this.emptyForm();
    this.showModal = true;
  }

  openEdit(t: MetaTemplate): void {
    this.editing = t;
    this.form = { ...t };
    this.showModal = true;
  }

  save(): void {
    const payload = {
      name: this.form.name?.trim(),
      category: this.form.category,
      language: this.form.language,
      status: this.form.status,
      content: this.form.content?.trim(),
    };

    const obs = this.editing
      ? this.metaService.updateTemplate(this.editing.id, payload)
      : this.metaService.createTemplate(payload);

    obs.subscribe({
      next: () => { this.showModal = false; this.load(); },
      error: () => this.showToast('Error al guardar', true),
    });
  }

  deleteTemplate(t: MetaTemplate): void {
    if (!confirm(`¿Eliminar plantilla "${t.name}"?`)) return;
    this.metaService.deleteTemplate(t.id).subscribe({
      next: () => this.load(),
      error: () => this.showToast('Error al eliminar', true),
    });
  }

  closeModal(): void { this.showModal = false; }

  statusLabel(s: string): string {
    return { approved: 'Aprobada', pending: 'Pendiente', rejected: 'Rechazada' }[s] || s;
  }

  private emptyForm(): Partial<MetaTemplate> {
    return { name: '', category: 'MARKETING', language: 'es', status: 'pending', content: '' };
  }

  private showToast(msg: string, isError = false): void {
    this.toast = msg;
    setTimeout(() => (this.toast = ''), 2500);
  }
}
