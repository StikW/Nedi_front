import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { PasswordModalComponent } from '../../components/password-modal/password-modal.component';
import { AuthService } from '../../core/services/auth.service';
import { EvolutionService } from '../../core/services/evolution.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent, PasswordModalComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  isEditing = false;
  isSubmitting = false;
  currentUser: User | null = null;
  showPasswordModal = false;

  /** WhatsApp del agente Nedi (Evolution) */
  evolutionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  evolutionInstance = '';
  evolutionNumber = '';
  qrDataUrl: string | null = null;
  pairingCode = '';
  isEvolutionLoading = false;
  isQrRefreshing = false;
  evolutionError = '';
  showQrModal = false;

  private statusPollTimer: ReturnType<typeof setInterval> | null = null;
  private qrRefreshTimer: ReturnType<typeof setInterval> | null = null;
  /** Evita que syncFromUser pise el estado mientras el modal QR esta abierto. */
  private qrSessionActive = false;
  private readonly phoneNumberPattern = /^\+?[1-9]\d{1,14}$/;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private evolutionService: EvolutionService,
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(this.phoneNumberPattern)]]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.authService.getMyProfile().subscribe({
      next: () => this.syncFromUser(this.authService.getCurrentUser()),
      error: (err) => console.warn('No se pudo refrescar el perfil:', err?.message || err)
    });
  }

  ngOnDestroy(): void {
    this.stopStatusPolling();
    this.stopQrRefresh();
  }

  get isInstructorOrAdmin(): boolean {
    const role = this.currentUser?.role;
    return role === 'instructor' || role === 'admin';
  }

  get isInstructor(): boolean {
    return this.currentUser?.role === 'instructor';
  }

  get evolutionStatusLabel(): string {
    switch (this.evolutionStatus) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Esperando escaneo';
      default: return 'Desconectado';
    }
  }

  private loadUserProfile(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.syncFromUser(user);
    });
  }

  private syncFromUser(user: User | null): void {
    if (!user) return;
    this.profileForm.patchValue({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || ''
    });
    if (this.isInstructor && !this.qrSessionActive) {
      this.evolutionStatus = user.evolutionStatus || 'disconnected';
      this.evolutionInstance = user.evolutionInstance || '';
      this.evolutionNumber = user.evolutionNumber || '';
      if (this.evolutionStatus === 'connecting' && !this.showQrModal) {
        this.startStatusPolling();
      }
    }
  }

  connectWhatsApp(): void {
    if (!this.isInstructor || this.isEvolutionLoading) return;
    this.qrSessionActive = true;
    this.showQrModal = true;
    this.isEvolutionLoading = true;
    this.evolutionError = '';
    this.fetchQr();
  }

  /** Obtiene o renueva el QR desde Evolution. */
  private fetchQr(): void {
    this.evolutionService.connect().subscribe({
      next: (res) => {
        this.isEvolutionLoading = false;
        this.isQrRefreshing = false;
        this.evolutionStatus = res.status === 'connected' ? 'connected' : 'connecting';
        this.evolutionInstance = res.instance;
        this.qrDataUrl = this.evolutionService.qrToDataUrl(res.qrBase64);
        this.pairingCode = res.pairingCode || '';

        if (this.evolutionStatus === 'connected') {
          this.closeQrModal(true);
          return;
        }

        this.startStatusPolling();
        this.startQrRefresh();
      },
      error: (err: Error) => {
        this.isEvolutionLoading = false;
        this.isQrRefreshing = false;
        this.evolutionError = err.message;
      }
    });
  }

  refreshQrCode(): void {
    if (this.isEvolutionLoading || this.isQrRefreshing) return;
    this.isQrRefreshing = true;
    this.evolutionError = '';
    this.fetchQr();
  }

  closeQrModal(force = false): void {
    if (!force && this.evolutionStatus === 'connecting' && this.qrDataUrl) {
      if (!confirm('¿Cerrar? Aún no has vinculado WhatsApp. Puedes volver a conectar cuando quieras.')) {
        return;
      }
    }
    this.showQrModal = false;
    this.qrSessionActive = false;
    this.qrDataUrl = null;
    this.pairingCode = '';
    this.stopQrRefresh();
    if (this.evolutionStatus !== 'connecting') {
      this.stopStatusPolling();
    }
  }

  onQrModalBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('qr-modal-overlay')) {
      this.closeQrModal();
    }
  }

  refreshEvolutionStatus(): void {
    if (!this.isInstructor) return;
    this.evolutionService.status().subscribe({
      next: (res) => this.applyEvolutionStatus(res.status, res.instance, res.number),
      error: (err: Error) => {
        this.evolutionError = err.message;
      }
    });
  }

  disconnectWhatsApp(): void {
    if (!this.isInstructor || this.isEvolutionLoading) return;
    if (!confirm('¿Desconectar el número de WhatsApp del agente Nedi? Los estudiantes dejarán de recibir respuestas por ese número.')) {
      return;
    }
    this.isEvolutionLoading = true;
    this.evolutionError = '';
    this.closeQrModal(true);

    this.evolutionService.logout().subscribe({
      next: () => {
        this.isEvolutionLoading = false;
        this.applyEvolutionStatus('disconnected');
      },
      error: (err: Error) => {
        this.isEvolutionLoading = false;
        this.evolutionError = err.message;
      }
    });
  }

  private applyEvolutionStatus(
    status: 'connected' | 'connecting' | 'disconnected',
    instance?: string,
    number?: string,
  ): void {
    this.evolutionStatus = status;
    if (instance) this.evolutionInstance = instance;
    if (number) this.evolutionNumber = number;

    if (status === 'connected') {
      this.qrSessionActive = false;
      this.showQrModal = false;
      this.qrDataUrl = null;
      this.pairingCode = '';
      this.stopStatusPolling();
      this.stopQrRefresh();
    } else if (status === 'disconnected') {
      this.qrSessionActive = false;
      this.showQrModal = false;
      this.qrDataUrl = null;
      this.pairingCode = '';
      this.evolutionNumber = '';
      this.stopStatusPolling();
      this.stopQrRefresh();
    }
  }

  private startStatusPolling(): void {
    this.stopStatusPolling();
    this.statusPollTimer = setInterval(() => {
      this.evolutionService.status().subscribe({
        next: (res) => this.applyEvolutionStatus(res.status, res.instance, res.number),
        error: () => undefined,
      });
    }, 4000);
  }

  private stopStatusPolling(): void {
    if (this.statusPollTimer) {
      clearInterval(this.statusPollTimer);
      this.statusPollTimer = null;
    }
  }

  /** Evolution expira el QR ~40-60s; lo renovamos mientras el modal esta abierto. */
  private startQrRefresh(): void {
    this.stopQrRefresh();
    this.qrRefreshTimer = setInterval(() => {
      if (this.showQrModal && this.evolutionStatus === 'connecting' && !this.isEvolutionLoading) {
        this.refreshQrCode();
      }
    }, 25000);
  }

  private stopQrRefresh(): void {
    if (this.qrRefreshTimer) {
      clearInterval(this.qrRefreshTimer);
      this.qrRefreshTimer = null;
    }
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

    const raw = this.profileForm.value;
    const payload: { name?: string; email?: string; phoneNumber?: string } = {
      name: raw.name?.trim(),
      email: raw.email?.trim(),
    };

    if (this.isInstructorOrAdmin) {
      const phone = (raw.phoneNumber || '').trim();
      payload.phoneNumber = phone.length > 0 ? phone : '';
    }

    this.authService.updateMyProfile(payload).subscribe({
      next: (updated) => {
        this.currentUser = updated;
        this.syncFromUser(updated);
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

  formatEvolutionPhone(number: string): string {
    if (!number) return '';
    return number.startsWith('+') ? number : `+${number}`;
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
