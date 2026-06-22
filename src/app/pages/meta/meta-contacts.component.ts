import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetaService } from '../../core/services/meta.service';
import { MetaContact } from '../../models/meta.model';

@Component({
  selector: 'app-meta-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meta-contacts.component.html',
  styleUrls: ['./meta-shared.css'],
})
export class MetaContactsComponent implements OnInit {
  contacts: MetaContact[] = [];
  isLoading = true;
  showModal = false;
  editingContact: MetaContact | null = null;
  toast = '';
  toastType: 'success' | 'error' = 'success';

  form: Partial<MetaContact> = this.emptyForm();

  constructor(private metaService: MetaService) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  loadContacts(): void {
    this.isLoading = true;
    this.metaService.getContacts().subscribe({
      next: (contacts) => {
        this.contacts = contacts;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  openCreate(): void {
    this.editingContact = null;
    this.form = this.emptyForm();
    this.showModal = true;
  }

  openEdit(contact: MetaContact): void {
    this.editingContact = contact;
    this.form = { ...contact };
    this.showModal = true;
  }

  save(): void {
    const payload = this.buildPayload();
    const obs = this.editingContact
      ? this.metaService.updateContact(this.editingContact.id, payload)
      : this.metaService.createContact(payload);

    obs.subscribe({
      next: () => {
        this.showModal = false;
        this.showToast('Contacto guardado correctamente');
        this.loadContacts();
      },
      error: () => this.showToast('Error al guardar el contacto', true),
    });
  }

  /** Solo envía campos editables al backend (evita id, createdAt, updatedAt). */
  private buildPayload(): Partial<MetaContact> {
    return {
      name: this.form.name?.trim(),
      company: this.form.company?.trim() || undefined,
      phone: this.form.phone?.trim(),
      email: this.form.email?.trim() || undefined,
      status: this.form.status,
    };
  }

  deleteContact(contact: MetaContact): void {
    if (!confirm(`¿Eliminar a ${contact.name}?`)) return;
    this.metaService.deleteContact(contact.id).subscribe({
      next: () => {
        this.showToast('Contacto eliminado');
        this.loadContacts();
      },
      error: () => this.showToast('Error al eliminar', true),
    });
  }

  closeModal(): void {
    this.showModal = false;
  }

  private emptyForm(): Partial<MetaContact> {
    return { name: '', company: '', phone: '', email: '', status: 'active' };
  }

  private showToast(msg: string, isError = false): void {
    this.toastType = isError ? 'error' : 'success';
    this.toast = msg;
    setTimeout(() => (this.toast = ''), 2500);
  }
}
