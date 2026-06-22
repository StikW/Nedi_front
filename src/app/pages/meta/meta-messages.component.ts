import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetaService } from '../../core/services/meta.service';
import { MetaContact, MetaTemplate } from '../../models/meta.model';

@Component({
  selector: 'app-meta-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meta-messages.component.html',
  styleUrls: ['./meta-shared.css', './meta-messages.component.css'],
})
export class MetaMessagesComponent implements OnInit {
  contacts: MetaContact[] = [];
  templates: MetaTemplate[] = [];
  contactSearch = '';
  selectedContactId = '';
  selectedTemplateId = '';
  variablesText = '';
  isSending = false;
  result: Record<string, unknown> | null = null;

  constructor(private metaService: MetaService) {}

  ngOnInit(): void {
    this.metaService.getContacts().subscribe(c => (this.contacts = c));
    this.metaService.getTemplates().subscribe(t => (this.templates = t));
  }

  get filteredContacts(): MetaContact[] {
    const q = this.contactSearch.toLowerCase();
    return this.contacts.filter(
      c => c.status === 'active' && (c.name.toLowerCase().includes(q) || c.phone.includes(q)),
    );
  }

  get approvedTemplates(): MetaTemplate[] {
    return this.templates.filter(t => t.status === 'approved');
  }

  get selectedTemplate(): MetaTemplate | undefined {
    return this.templates.find(t => t.id === this.selectedTemplateId);
  }

  send(): void {
    if (!this.selectedContactId || !this.selectedTemplateId) return;

    let variables: Record<string, string> = {};
    try {
      if (this.variablesText.trim()) {
        variables = JSON.parse(this.variablesText);
      }
    } catch {
      alert('Variables inválidas. Usa formato JSON: {"1": "valor"}');
      return;
    }

    this.isSending = true;
    this.result = null;

    this.metaService.sendMessage({
      contactId: this.selectedContactId,
      templateId: this.selectedTemplateId,
      variables,
    }).subscribe({
      next: (res) => {
        this.result = res;
        this.isSending = false;
      },
      error: (err) => {
        this.isSending = false;
        alert(err?.error?.message || 'Error al enviar el mensaje. Verifica Configuración API y plantillas sincronizadas.');
      },
    });
  }
}
