import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { PasswordModalComponent } from '../../components/password-modal/password-modal.component';
import { AuthService } from '../../core/services/auth.service';
import { DialogService } from '../../core/services/dialog.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NavbarComponent, PasswordModalComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isEditing = false;
  isSubmitting = false;
  currentUser: User | null = null;
  showPasswordModal = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogService: DialogService,
  ) {
    this.profileForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.authService.getMyProfile().subscribe({
      next: () => this.syncFromUser(this.authService.getCurrentUser()),
      error: (err) => console.warn('No se pudo refrescar el perfil:', err?.message || err),
    });
  }

  get isInstructor(): boolean {
    return this.currentUser?.role === 'instructor';
  }

  get backLink(): string {
    switch (this.currentUser?.role) {
      case 'instructor':
        return '/instructor';
      case 'admin':
        return '/admin';
      default:
        return '/my-learning-path';
    }
  }

  get backLabel(): string {
    switch (this.currentUser?.role) {
      case 'instructor':
      case 'admin':
        return 'Volver al panel';
      default:
        return 'Volver a mi ruta';
    }
  }

  get tutorPhoneNumber(): string {
    return this.currentUser?.evolutionNumber || this.currentUser?.phoneNumber || '';
  }

  get evolutionStatus(): 'disconnected' | 'connecting' | 'connected' {
    return this.currentUser?.evolutionStatus || 'disconnected';
  }

  get evolutionStatusLabel(): string {
    switch (this.evolutionStatus) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Esperando escaneo';
      default:
        return 'Desconectado';
    }
  }

  private loadUserProfile(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.syncFromUser(user);
    });
  }

  private syncFromUser(user: User | null): void {
    if (!user) return;
    this.profileForm.patchValue({
      email: user.email || '',
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.syncFromUser(this.currentUser);
    }
  }

  onSubmit(): void {
    if (!this.profileForm.valid || !this.currentUser) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload = {
      email: this.profileForm.value.email?.trim(),
    };

    this.authService.updateMyProfile(payload).subscribe({
      next: (updated) => {
        this.currentUser = updated;
        this.syncFromUser(updated);
        this.isSubmitting = false;
        this.isEditing = false;
        this.dialogService.alert({
          title: 'Perfil actualizado',
          message: 'Tu correo se guardó correctamente.',
          variant: 'success',
        });
      },
      error: (err: Error) => {
        this.isSubmitting = false;
        this.dialogService.alert({
          title: 'Error',
          message: err.message || 'No se pudo actualizar el perfil.',
          variant: 'danger',
        });
      },
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['email']) return 'Por favor ingresa un correo electrónico válido';
    return 'Valor inválido';
  }

  getFieldClass(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.errors && field?.touched) {
      return 'error';
    }
    return '';
  }

  formatEvolutionPhone(number: string): string {
    if (!number) return 'Sin vincular';
    return number.startsWith('+') ? number : `+${number}`;
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
  }

  onPasswordChanged(): void {
    // El modal ya muestra feedback al usuario.
  }
}
