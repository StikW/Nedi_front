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
    clientIdApp: '',
    clientSecretApp: '',
    businessAccountId: '',
    accessToken: '',
    apiKey: ''
  };

  roles = [
    { value: 'instructor', label: 'Instructor' }
  ];

  ngOnInit() {
    if (this.mode === 'edit' && this.user) {
      this.formData = { ...this.user };
    } else {
      this.resetForm();
    }
  }

  ngOnChanges() {
    if (this.mode === 'edit' && this.user) {
      this.formData = { ...this.user };
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
      
      // En modo edición, si la contraseña está vacía, no la enviamos
      if (this.mode === 'edit' && !dataToSubmit.password?.trim()) {
        delete dataToSubmit.password;
      }
      
      this.submitUser.emit(dataToSubmit);
    }
  }

  onClose() {
    this.closeModal.emit();
    this.resetForm();
  }

  isFormValid(): boolean {
    const requiredFields = [
      this.formData.name?.trim(),
      this.formData.email?.trim(),
      this.formData.clientIdApp?.trim(),
      this.formData.clientSecretApp?.trim(),
      this.formData.businessAccountId?.trim(),
      this.formData.accessToken?.trim(),
      this.formData.apiKey?.trim()
    ];
    
    // En modo creación, la contraseña es obligatoria
    if (this.mode === 'create') {
      requiredFields.push(this.formData.password?.trim());
    }
    
    return requiredFields.every(field => !!field);
  }

  get modalTitle(): string {
    return this.mode === 'create' ? 'Agregar Instructor' : 'Editar Usuario';
  }

  get submitButtonText(): string {
    return this.mode === 'create' ? 'Crear Instructor' : 'Actualizar Usuario';
  }
}
