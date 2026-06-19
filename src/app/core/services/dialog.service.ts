import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type DialogVariant = 'default' | 'danger' | 'warning' | 'success';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
}

export interface AlertDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  variant?: DialogVariant;
}

export type DialogState =
  | { type: 'none' }
  | { type: 'confirm'; config: ConfirmDialogConfig; resolve: (value: boolean) => void }
  | { type: 'alert'; config: AlertDialogConfig; resolve: () => void };

@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly state$ = new BehaviorSubject<DialogState>({ type: 'none' });

  confirm(config: ConfirmDialogConfig): Promise<boolean> {
    return new Promise(resolve => {
      this.state$.next({
        type: 'confirm',
        config: {
          confirmText: 'Confirmar',
          cancelText: 'Cancelar',
          variant: 'default',
          ...config,
        },
        resolve,
      });
    });
  }

  alert(config: AlertDialogConfig): Promise<void> {
    return new Promise(resolve => {
      this.state$.next({
        type: 'alert',
        config: {
          confirmText: 'Entendido',
          variant: 'default',
          ...config,
        },
        resolve,
      });
    });
  }

  accept(): void {
    const state = this.state$.value;
    if (state.type === 'confirm') {
      state.resolve(true);
    } else if (state.type === 'alert') {
      state.resolve();
    }
    this.close();
  }

  cancel(): void {
    const state = this.state$.value;
    if (state.type === 'confirm') {
      state.resolve(false);
    }
    this.close();
  }

  close(): void {
    this.state$.next({ type: 'none' });
  }
}
