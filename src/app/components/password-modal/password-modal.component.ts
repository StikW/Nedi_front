import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-password-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-modal.component.html',
  styleUrls: ['./password-modal.component.css']
})
export class PasswordModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() passwordChanged = new EventEmitter<void>();

  passwordForm: FormGroup;
  isSubmitting = false;
  showPasswords = {
    current: false,
    new: false,
    confirm: false
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Reset form when modal opens
    if (this.isOpen) {
      this.resetForm();
    }
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.passwordForm.reset();
    this.isSubmitting = false;
    this.showPasswords = {
      current: false,
      new: false,
      confirm: false
    };
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    this.showPasswords[field] = !this.showPasswords[field];
  }

  onSubmit(): void {
    if (this.passwordForm.valid) {
      this.isSubmitting = true;
      
      const { currentPassword, newPassword } = this.passwordForm.value;
      
      this.authService.changePassword(currentPassword, newPassword).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.passwordChanged.emit();
          this.closeModal.emit();
          
          // Mostrar mensaje de éxito
          alert('Contraseña cambiada exitosamente');
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error al cambiar contraseña:', error);
          
          // Mostrar mensaje de error
          alert(error.message || 'Error al cambiar la contraseña');
        }
      });
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['minlength']) return `La contraseña debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['passwordMismatch']) return 'Las contraseñas no coinciden';

    return 'Valor inválido';
  }

  getFieldClass(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);
    if (field?.errors && field?.touched) {
      return 'error';
    }
    return '';
  }

  getPasswordStrength(password: string): { strength: string; color: string } {
    if (!password) return { strength: '', color: '' };
    
    const length = password.length;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let score = 0;
    if (length >= 8) score++;
    if (hasUpper) score++;
    if (hasLower) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    
    if (score <= 2) return { strength: 'Débil', color: '#ef4444' };
    if (score <= 3) return { strength: 'Media', color: '#f59e0b' };
    if (score <= 4) return { strength: 'Buena', color: '#10b981' };
    return { strength: 'Muy Buena', color: '#059669' };
  }

  hasUpperCase(password: string): boolean {
    return /[A-Z]/.test(password || '');
  }

  hasLowerCase(password: string): boolean {
    return /[a-z]/.test(password || '');
  }

  hasNumber(password: string): boolean {
    return /\d/.test(password || '');
  }
}
