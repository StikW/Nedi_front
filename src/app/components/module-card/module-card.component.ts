import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Module } from '../../models/module.model';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-module-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './module-card.component.html',
  styleUrls: ['./module-card.component.css']
})
export class ModuleCardComponent {
  @Input() module!: Module;
  @Input() showActions: boolean = true;
  @Input() isEditable: boolean = false;
  
  @Output() editModule = new EventEmitter<Module>();
  @Output() deleteModule = new EventEmitter<string>();
  @Output() viewModule = new EventEmitter<Module>();

  constructor(private dialogService: DialogService) {}

  onEdit(event: Event): void {
    event.stopPropagation();
    this.editModule.emit(this.module);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.dialogService.confirm({
      title: 'Eliminar módulo',
      message: '¿Estás seguro de que quieres eliminar este módulo? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger',
    }).then(confirmed => {
      if (confirmed) {
        this.deleteModule.emit(this.module.id);
      }
    });
  }

  onView(): void {
    this.viewModule.emit(this.module);
  }
}
