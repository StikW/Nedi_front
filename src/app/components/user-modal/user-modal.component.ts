import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
export class UserModalComponent implements OnInit {
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
    isActive: true,
    clientIdApp: '',
    clientSecretApp: '',
    businessAccountId: '',
    accessToken: '',
    apiKey: ''
  };

  roles = [
    { value: 'instructor', label: 'Instructor' },
    { value: 'meta', label: 'Meta' },
  ];

  ngOnInit() {
    if (this.mode === 'edit' && this.user) {
      this.formData = { ...this.user, isActive: this.user.isActive !== false };
    } else {
      this.resetForm();
    }
  }

  ngOnChanges() {
    if (this.mode === 'edit' && this.user) {
      this.formData = { ...this.user, isActive: this.user.isActive !== false };
    } else {
      this.resetForm();
    }
  }

  get isInstructor(): boolean {
    return this.formData.role === 'instructor';
  }

  get isMeta(): boolean {
    return this.formData.role === 'meta';
  }

  private resetForm() {
    this.formData = {
      name: '',
      email: '',
      role: 'instructor',
      password: '',
      isActive: true,
      clientIdApp: '',
      clientSecretApp: '',
      businessAccountId: '',
      accessToken: '',
      apiKey: ''
    };
  }

  onSubmit() {
    if (this.isFormValid()) {
      const dataToSubmit = { ...this.formData };

      if (this.mode === 'edit' && !dataToSubmit.password?.trim()) {
        delete dataToSubmit.password;
      }

      // Meta users don't need instructor integration fields
      if (this.isMeta) {
        delete dataToSubmit.clientIdApp;
        delete dataToSubmit.clientSecretApp;
        delete dataToSubmit.businessAccountId;
        delete dataToSubmit.accessToken;
        delete dataToSubmit.apiKey;
      }

      this.submitUser.emit(dataToSubmit);
    }
  }

  onClose() {
    this.closeModal.emit();
    this.resetForm();
  }

  isFormValid(): boolean {
    const baseFields = [
      this.formData.name?.trim(),
      this.formData.email?.trim(),
    ];

    if (this.mode === 'create') {
      baseFields.push(this.formData.password?.trim());
    }

    if (this.isInstructor) {
      baseFields.push(
        this.formData.clientIdApp?.trim(),
        this.formData.clientSecretApp?.trim(),
        this.formData.businessAccountId?.trim(),
        this.formData.accessToken?.trim(),
        this.formData.apiKey?.trim(),
      );
    }

    return baseFields.every(field => !!field);
  }

  get modalTitle(): string {
    if (this.mode === 'edit') return 'Editar Usuario';
    return this.isMeta ? 'Agregar Usuario Meta' : 'Agregar Instructor';
  }

  get submitButtonText(): string {
    if (this.mode === 'edit') return 'Actualizar Usuario';
    return this.isMeta ? 'Crear Usuario Meta' : 'Crear Instructor';
  }
}
