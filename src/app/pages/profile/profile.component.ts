import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { PasswordModalComponent } from '../../components/password-modal/password-modal.component';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent, PasswordModalComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isEditing = false;
  isSubmitting = false;
  currentUser: User | null = null;
  showPasswordModal = false;
  /**
   * Regex E.164 (con o sin "+"). Coincide con la validación del backend
   * (`Matches(/^\+?[1-9]\d{1,14}$/)`).
   */
  private readonly phoneNumberPattern = /^\+?[1-9]\d{1,14}$/;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(this.phoneNumberPattern)]]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
    // Pedimos al backend la versión más reciente del perfil (por si en el JWT
    // guardado en localStorage no estaba todavía el campo phoneNumber).
    this.authService.getMyProfile().subscribe({
      next: () => this.applyUserToForm(this.authService.getCurrentUser()),
      error: (err) => console.warn('No se pudo refrescar el perfil:', err?.message || err)
    });
  }

  /** Solo instructores y admins ven/editan el campo phoneNumber. */
  get isInstructorOrAdmin(): boolean {
    const role = this.currentUser?.role;
    return role === 'instructor' || role === 'admin';
  }

  private loadUserProfile(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.applyUserToForm(user);
    });
  }

  private applyUserToForm(user: User | null): void {
    if (!user) return;
    this.profileForm.patchValue({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || ''
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Cancelar edición → restaurar valores actuales
      this.applyUserToForm(this.currentUser);
    }
  }

  onSubmit(): void {
    if (!this.profileForm.valid || !this.currentUser) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const raw = this.profileForm.value;
    const payload: { name?: string; email?: string; phoneNumber?: string } = {
      name: raw.name?.trim(),
      email: raw.email?.trim(),
    };

    // Solo enviamos phoneNumber si el rol lo soporta y hay valor.
    if (this.isInstructorOrAdmin) {
      const phone = (raw.phoneNumber || '').trim();
      payload.phoneNumber = phone.length > 0 ? phone : '';
    }

    this.authService.updateMyProfile(payload).subscribe({
      next: (updated) => {
        this.currentUser = updated;
        this.applyUserToForm(updated);
        this.isSubmitting = false;
        this.isEditing = false;
        alert('Perfil actualizado exitosamente');
      },
      error: (err: Error) => {
        this.isSubmitting = false;
        alert(err.message || 'Error al actualizar el perfil');
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['email']) return 'Por favor ingresa un correo electrónico válido';
    if (field.errors['minlength']) return `La longitud mínima es de ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['maxlength']) return `La longitud máxima es de ${field.errors['maxlength'].requiredLength} caracteres`;
    if (field.errors['pattern']) {
      if (fieldName === 'phoneNumber') {
        return 'Formato inválido. Usa E.164, por ejemplo: +573001234567';
      }
      return 'Por favor ingresa un formato válido';
    }

    return 'Valor inválido';
  }

  getFieldClass(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.errors && field?.touched) {
      return 'error';
    }
    return '';
  }

  getFormattedDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const parsed = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
  }

  onPasswordChanged(): void {
    console.log('Contraseña cambiada exitosamente');
  }
}
