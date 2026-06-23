import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-modal.component.html',
  styleUrls: ['./user-modal.component.css']
})
export class UserModalComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() user: User | null = null;

  @Output() closeModal = new EventEmitter<void>();
  @Output() submitUser = new EventEmitter<Partial<User>>();

  formData: Partial<User> = {
    name: '',
    email: '',
    role: 'instructor',
    password: '',
  };

  ngOnInit() {
    this.syncFormFromInputs();
  }

  ngOnChanges() {
    this.syncFormFromInputs();
  }

  get showInstructorInfo(): boolean {
    return this.mode === 'edit' && this.user?.role === 'instructor';
  }

  private syncFormFromInputs() {
    if (this.mode === 'edit' && this.user) {
      this.formData = {
        name: this.user.name,
        email: this.user.email,
        role: this.user.role,
        password: '',
      };
    } else {
      this.resetForm();
    }
  }

  private resetForm() {
    this.formData = {
      name: '',
      email: '',
      role: 'instructor',
      password: '',
    };
  }

  onSubmit() {
    if (!this.isFormValid()) return;

    const payload: Partial<User> = {
      name: this.formData.name?.trim(),
      email: this.formData.email?.trim(),
    };

    if (this.mode === 'create') {
      payload.role = 'instructor';
      payload.password = this.formData.password?.trim();
    } else if (this.formData.password?.trim()) {
      payload.password = this.formData.password.trim();
    }

    this.submitUser.emit(payload);
  }

  onClose() {
    this.closeModal.emit();
    this.resetForm();
  }

  isFormValid(): boolean {
    const fields = [this.formData.name?.trim(), this.formData.email?.trim()];
    if (this.mode === 'create') {
      fields.push(this.formData.password?.trim());
    }
    return fields.every((field) => !!field);
  }

  roleLabel(role: User['role'] | string): string {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      instructor: 'Instructor',
      student: 'Estudiante',
    };
    return labels[role] || role;
  }

  evolutionStatusLabel(status?: User['evolutionStatus']): string {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando…';
      default:
        return 'Sin conectar';
    }
  }

  formatPhone(phone?: string): string {
    if (!phone?.trim()) {
      return 'Sin vincular';
    }
    const digits = phone.replace(/\D/g, '');
    return digits ? `+${digits}` : phone;
  }

  get modalTitle(): string {
    if (this.mode === 'edit') return 'Editar usuario';
    return 'Agregar instructor';
  }

  get submitButtonText(): string {
    if (this.mode === 'edit') return 'Actualizar usuario';
    return 'Crear instructor';
  }
}
