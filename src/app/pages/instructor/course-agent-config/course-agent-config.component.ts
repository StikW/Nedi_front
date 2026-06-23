import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { AuthService } from '../../../core/services/auth.service';
import { EvolutionService } from '../../../core/services/evolution.service';
import { DialogService } from '../../../core/services/dialog.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-course-agent-config',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './course-agent-config.component.html',
  styleUrls: ['./course-agent-config.component.scss'],
})
export class CourseAgentConfigComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;

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
  private qrSessionActive = false;

  constructor(
    private authService: AuthService,
    private evolutionService: EvolutionService,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.syncFromUser(this.authService.getCurrentUser());
    this.checkEvolutionHealth();
    this.authService.getMyProfile().subscribe({
      next: () => {
        this.syncFromUser(this.authService.getCurrentUser());
        if (this.evolutionStatus === 'connected' && !this.tutorPhoneNumber) {
          this.refreshEvolutionStatus();
        }
      },
      error: (err) => console.warn('No se pudo refrescar el perfil:', err?.message || err),
    });
  }

  ngOnDestroy(): void {
    this.stopStatusPolling();
    this.stopQrRefresh();
  }

  get tutorPhoneNumber(): string {
    return this.evolutionNumber || this.currentUser?.phoneNumber || '';
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

  private syncFromUser(user: User | null): void {
    if (!user) return;
    this.currentUser = user;
    if (!this.qrSessionActive) {
      this.evolutionStatus = user.evolutionStatus || 'disconnected';
      this.evolutionInstance = user.evolutionInstance || '';
      this.evolutionNumber = user.evolutionNumber || '';
      if (this.evolutionStatus === 'connecting' && !this.showQrModal) {
        this.startStatusPolling();
      }
    }
  }

  connectWhatsApp(): void {
    if (this.isEvolutionLoading) return;
    this.qrSessionActive = true;
    this.showQrModal = true;
    this.isEvolutionLoading = true;
    this.evolutionError = '';
    this.fetchQr();
  }

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

        if (!this.qrDataUrl && !this.pairingCode) {
          this.evolutionError =
            'Evolution no devolvió un código QR. Verifica la conexión con el servidor de WhatsApp.';
          this.qrSessionActive = false;
          this.showQrModal = false;
          return;
        }

        this.startStatusPolling();
        this.startQrRefresh();
      },
      error: (err: Error) => {
        this.isEvolutionLoading = false;
        this.isQrRefreshing = false;
        this.qrSessionActive = false;
        this.showQrModal = false;
        this.evolutionError = err.message;
        this.refreshEvolutionStatus();
      },
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
      this.dialogService
        .confirm({
          title: 'Cerrar vinculación',
          message:
            'Aún no has vinculado WhatsApp. ¿Deseas cerrar? Puedes volver a conectar cuando quieras.',
          confirmText: 'Cerrar',
          variant: 'warning',
        })
        .then((confirmed) => {
          if (confirmed) this.finishCloseQrModal();
        });
      return;
    }
    this.finishCloseQrModal();
  }

  private finishCloseQrModal(): void {
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
    this.evolutionService.status().subscribe({
      next: (res) => this.applyEvolutionStatus(res.status, res.instance, res.number),
      error: (err: Error) => {
        this.evolutionError = err.message;
      },
    });
  }

  disconnectWhatsApp(): void {
    if (this.isEvolutionLoading) return;

    this.dialogService
      .confirm({
        title: 'Desconectar WhatsApp',
        message:
          '¿Desconectar el número de WhatsApp del agente Nedi? Los estudiantes dejarán de recibir respuestas por ese número.',
        confirmText: 'Desconectar',
        variant: 'danger',
      })
      .then((confirmed) => {
        if (!confirmed) return;

        this.isEvolutionLoading = true;
        this.evolutionError = '';
        this.closeQrModal(true);

        this.evolutionService.logout().subscribe({
          next: (res) => {
            this.isEvolutionLoading = false;
            if (res.success) {
              this.applyEvolutionStatus('disconnected');
              this.evolutionNumber = '';
            } else {
              this.evolutionError = 'No se pudo desconectar WhatsApp. Intenta de nuevo.';
              this.refreshEvolutionStatus();
            }
          },
          error: (err: Error) => {
            this.isEvolutionLoading = false;
            this.evolutionError = err.message;
            this.refreshEvolutionStatus();
          },
        });
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

    if (status === 'connected' || status === 'disconnected') {
      this.qrSessionActive = false;
      this.showQrModal = false;
      this.qrDataUrl = null;
      this.pairingCode = '';
      this.stopStatusPolling();
      this.stopQrRefresh();
      this.refreshInstructorProfile();
    }
  }

  private refreshInstructorProfile(): void {
    this.authService.getMyProfile().subscribe({
      next: () => this.syncFromUser(this.authService.getCurrentUser()),
      error: () => undefined,
    });
  }

  private startStatusPolling(): void {
    this.stopStatusPolling();
    this.statusPollTimer = setInterval(() => {
      this.evolutionService.status().subscribe({
        next: (res) => {
          this.evolutionError = '';
          this.applyEvolutionStatus(res.status, res.instance, res.number);
        },
        error: (err: Error) => {
          this.evolutionError = err.message;
        },
      });
    }, 4000);
  }

  private checkEvolutionHealth(): void {
    this.evolutionService.health().subscribe({
      next: (health) => {
        if (!health.reachable) {
          this.evolutionError =
            'El servidor de WhatsApp (Evolution) no es accesible desde el backend. ' +
            (health.message ? `Detalle: ${health.message}` : '');
        }
      },
      error: () => undefined,
    });
  }

  private stopStatusPolling(): void {
    if (this.statusPollTimer) {
      clearInterval(this.statusPollTimer);
      this.statusPollTimer = null;
    }
  }

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

  formatEvolutionPhone(number: string): string {
    if (!number) return 'Sin vincular';
    return number.startsWith('+') ? number : `+${number}`;
  }
}
