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
  isSaving = false;
  syncMessage = '';
  showModal = false;
  editing: MetaTemplate | null = null;
  toast = '';
  toastType: 'success' | 'error' = 'error';

  submitToMeta = true;
  variableExamples: string[] = [];

  form: Partial<MetaTemplate> = this.emptyForm();
  readonly contentPlaceholder = 'Hola {{1}}, referencia {{2}}.';
  readonly variablesHint = 'Variables posicionales: {{1}}, {{2}}, etc.';

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
    this.submitToMeta = true;
    this.form = this.emptyForm();
    this.syncVariableExamples();
    this.showModal = true;
  }

  openEdit(t: MetaTemplate): void {
    this.editing = t;
    this.submitToMeta = false;
    this.form = { ...t };
    this.syncVariableExamples();
    this.showModal = true;
  }

  onContentChange(): void {
    this.syncVariableExamples();
  }

  onNameBlur(): void {
    if (!this.form.name || this.editing) return;
    this.form.name = this.form.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  get detectedVariables(): string[] {
    const content = this.form.content || '';
    const matches = content.match(/\{\{(\d+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/\D/g, '')))].sort(
      (a, b) => Number(a) - Number(b),
    );
  }

  save(): void {
    if (this.isSaving) return;

    const payload = {
      name: this.form.name?.trim(),
      category: this.form.category,
      language: this.form.language,
      status: this.form.status,
      content: this.form.content?.trim(),
    };

    if (this.editing) {
      this.isSaving = true;
      this.metaService.updateTemplate(this.editing.id, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.showModal = false;
          this.load();
          this.showToast('Plantilla actualizada', false);
        },
        error: (err) => {
          this.isSaving = false;
          this.showToast(err?.error?.message || 'Error al guardar', true);
        },
      });
      return;
    }

    const createPayload = {
      ...payload,
      submitToMeta: this.submitToMeta,
      variableExamples:
        this.submitToMeta && this.detectedVariables.length > 0
          ? this.variableExamples.map((v) => v.trim())
          : undefined,
    };

    if (this.submitToMeta && this.detectedVariables.length > 0) {
      const missing = createPayload.variableExamples?.some((v) => !v);
      if (missing) {
        this.showToast('Completa un ejemplo para cada variable', true);
        return;
      }
    }

    this.isSaving = true;
    this.metaService.createTemplate(createPayload).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.showModal = false;
        this.load();
        this.showToast(
          res.message || (this.submitToMeta ? 'Plantilla enviada a Meta' : 'Plantilla guardada'),
          false,
        );
      },
      error: (err) => {
        this.isSaving = false;
        this.showToast(err?.error?.message || 'Error al crear plantilla', true);
      },
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

  private syncVariableExamples(): void {
    const count = this.detectedVariables.length;
    while (this.variableExamples.length < count) {
      this.variableExamples.push('');
    }
    if (this.variableExamples.length > count) {
      this.variableExamples = this.variableExamples.slice(0, count);
    }
  }

  private emptyForm(): Partial<MetaTemplate> {
    return { name: '', category: 'UTILITY', language: 'es_CO', status: 'pending', content: '' };
  }

  private showToast(msg: string, isError = false): void {
    this.toastType = isError ? 'error' : 'success';
    this.toast = msg;
    setTimeout(() => (this.toast = ''), 4000);
  }
}
