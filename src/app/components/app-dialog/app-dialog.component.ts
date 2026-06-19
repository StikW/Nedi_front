import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DialogService, DialogState } from '../../core/services/dialog.service';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-dialog.component.html',
  styleUrls: ['./app-dialog.component.css'],
})
export class AppDialogComponent implements OnInit, OnDestroy {
  dialogState: DialogState = { type: 'none' };
  private sub?: Subscription;

  constructor(private readonly dialogService: DialogService) {}

  ngOnInit(): void {
    this.sub = this.dialogService.state$.subscribe(state => {
      this.dialogState = state;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get title(): string {
    if (this.dialogState.type === 'none') return '';
    return this.dialogState.config.title;
  }

  get message(): string {
    if (this.dialogState.type === 'none') return '';
    return this.dialogState.config.message;
  }

  get confirmText(): string {
    if (this.dialogState.type === 'none') return '';
    return this.dialogState.config.confirmText || 'Confirmar';
  }

  get cancelText(): string {
    if (this.dialogState.type === 'confirm') {
      return this.dialogState.config.cancelText || 'Cancelar';
    }
    return '';
  }

  get variantClass(): string {
    if (this.dialogState.type === 'none') return 'default';
    return this.dialogState.config.variant || 'default';
  }

  accept(): void {
    this.dialogService.accept();
  }

  cancel(): void {
    this.dialogService.cancel();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      if (this.dialogState.type === 'confirm') {
        this.cancel();
      } else if (this.dialogState.type === 'alert') {
        this.accept();
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialogState.type === 'confirm') {
      this.cancel();
    } else if (this.dialogState.type === 'alert') {
      this.accept();
    }
  }
}
