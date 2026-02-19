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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.profileForm.patchValue({
          name: user.name || '',
          email: user.email || ''
        });
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset form to current values
      this.loadUserProfile();
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid && this.currentUser) {
      this.isSubmitting = true;
      
      // Simulate API call
      setTimeout(() => {
        // Update user data
        const updatedUser: User = {
          ...this.currentUser,
          ...this.profileForm.value
        };
        
        // In a real app, you would call a service to update the user
        console.log('Profile updated:', updatedUser);
        
        this.isSubmitting = false;
        this.isEditing = false;
        
        // Show success message (you could add a toast notification here)
        alert('Perfil actualizado exitosamente');
      }, 1000);
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['email']) return 'Por favor ingresa un correo electrónico válido';
    if (field.errors['minlength']) return `La longitud mínima es de ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['maxlength']) return `La longitud máxima es de ${field.errors['maxlength'].requiredLength} caracteres`;
    if (field.errors['pattern']) return 'Por favor ingresa un formato válido';

    return 'Valor inválido';
  }

  getFieldClass(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.errors && field?.touched) {
      return 'error';
    }
    return '';
  }

  getFormattedDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return date.toLocaleDateString('es-ES', {
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
    // Aquí podrías agregar lógica adicional después de cambiar la contraseña
    console.log('Contraseña cambiada exitosamente');
  }
}
