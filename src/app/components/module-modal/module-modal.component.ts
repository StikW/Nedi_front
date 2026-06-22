import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Module, ModuleResource } from '../../models/module.model';
import { UploadsService } from '../../core/services/uploads.service';

export interface ModuleFormData {
  title: string;
  description: string;
  files?: File[];
  videoUrl?: string;
  resourcesToKeep?: ModuleResource[];
}

export interface ModuleModalConfig {
  title: string;
  submitButtonText: string;
  loadingButtonText: string;
}

@Component({
  selector: 'app-module-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './module-modal.component.html',
  styleUrls: ['./module-modal.component.css']
})
export class ModuleModalComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() module?: Module; // Para modo edición
  @Input() courseId?: string | null; // ID del curso para descargas
  
  @Output() closeModal = new EventEmitter<void>();
  @Output() submitModule = new EventEmitter<ModuleFormData>();

  moduleData: ModuleFormData = {
    title: '',
    description: '',
    files: []
  };

  selectedFiles: File[] = [];
  videoUrl: string = '';
  existingResources: ModuleResource[] = [];
  resourcesToDelete: number[] = []; // Array de índices de recursos a eliminar
  fileError: string | null = null; // Mensaje de error para archivos no válidos
  modalConfig: ModuleModalConfig = {
    title: 'Agregar Nuevo Módulo',
    submitButtonText: 'Agregar Módulo',
    loadingButtonText: 'Agregando...'
  };

  constructor(private uploadsService: UploadsService) {}

  ngOnInit() {
    this.updateModalConfig();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['mode'] || changes['module']) {
      this.updateModalConfig();
      this.initializeFormData();
    }
  }

  private updateModalConfig() {
    if (this.mode === 'edit') {
      this.modalConfig = {
        title: 'Editar Módulo',
        submitButtonText: 'Actualizar Módulo',
        loadingButtonText: 'Actualizando...'
      };
    } else {
      this.modalConfig = {
        title: 'Agregar Nuevo Módulo',
        submitButtonText: 'Agregar Módulo',
        loadingButtonText: 'Agregando...'
      };
    }
  }

  private initializeFormData() {
    if (this.mode === 'edit' && this.module) {
      // El backend envía 'content' pero el componente usa 'videoUrl'
      const videoUrlValue = (this.module as any).content || (this.module as any).videoUrl || '';
      this.moduleData = {
        title: this.module.title,
        description: this.module.description,
        files: [],
        videoUrl: videoUrlValue
      };
      this.videoUrl = videoUrlValue;
      this.existingResources = this.module.resources || [];
    } else {
      this.moduleData = {
        title: '',
        description: '',
        files: []
      };
      this.videoUrl = '';
      this.existingResources = [];
    }
    this.selectedFiles = [];
    this.resourcesToDelete = [];
    this.fileError = null;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      
      // Validar que todos los archivos sean PDFs
      const invalidFiles = files.filter(file => {
        const extension = file.name.toLowerCase().split('.').pop();
        const mimeType = file.type.toLowerCase();
        return extension !== 'pdf' && mimeType !== 'application/pdf';
      });

      if (invalidFiles.length > 0) {
        this.fileError = `Solo se permiten archivos PDF. Los siguientes archivos no son válidos: ${invalidFiles.map(f => f.name).join(', ')}`;
        // Limpiar el input
        input.value = '';
        return;
      }

      // Si todos los archivos son válidos, agregarlos
      this.fileError = null;
      this.selectedFiles = files;
      this.moduleData.files = this.selectedFiles;

      // Al subir un PDF nuevo en edición, reemplazar los anteriores (no acumular)
      if (this.mode === 'edit' && files.length > 0) {
        this.existingResources.forEach((_, index) => {
          if (!this.resourcesToDelete.includes(index)) {
            this.resourcesToDelete.push(index);
          }
        });
      }
    }
  }

  onVideoUrlChange() {
    this.moduleData.videoUrl = this.videoUrl;
  }

  clearVideoUrl() {
    this.videoUrl = '';
    this.moduleData.videoUrl = undefined;
  }

  onSubmit() {
    if (!this.moduleData.title || !this.moduleData.description) {
      return;
    }

    // Obtener los recursos que se mantendrán (excluyendo los marcados para eliminación)
    const resourcesToKeep = this.getResourcesToKeep();

    this.submitModule.emit({
      title: this.moduleData.title,
      description: this.moduleData.description,
      files: this.selectedFiles,
      videoUrl: this.videoUrl.trim() || undefined,
      resourcesToKeep: resourcesToKeep
    });
  }

  onClose() {
    this.closeModal.emit();
    this.resetForm();
  }

  private resetForm() {
    this.moduleData = {
      title: '',
      description: '',
      files: []
    };
    this.selectedFiles = [];
    this.videoUrl = '';
    this.existingResources = [];
    this.resourcesToDelete = [];
    this.fileError = null;
  }

  // Método público para resetear el formulario desde el componente padre
  resetFormData() {
    this.resetForm();
  }

  // Método público para inicializar datos desde el componente padre
  initializeWithModule(module: Module) {
    this.module = module;
    this.initializeFormData();
  }

  /**
   * Formatea el tamaño del archivo en bytes a una representación legible
   * @param bytes Tamaño en bytes
   * @returns String formateado (ej: "1.5 MB")
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Descarga un recurso del módulo
   * @param resource Recurso a descargar
   */
  downloadResource(resource: ModuleResource) {
    if (!this.courseId || !this.module) {
      console.error('CourseId o Module no disponible para descargar recurso');
      return;
    }

    // Extraer el fileKey de la URL del recurso
    // La URL se arma desde runtime config + fileKey (backend lee .env)
    const fileKey = resource.url.split('/').pop();
    
    if (!fileKey) {
      console.error('No se pudo extraer el fileKey de la URL del recurso');
      return;
    }

    console.log('Descargando recurso:', resource.name, 'con fileKey:', fileKey);
    
    this.uploadsService.downloadModuleFile(this.courseId, this.module.id, fileKey).subscribe({
      next: (response: { downloadUrl: string }) => {
        // Crear un enlace temporal para descargar usando la URL pre-firmada
        const link = document.createElement('a');
        link.href = response.downloadUrl;
        link.download = resource.name; // Usar el nombre original del archivo
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      error: (error) => {
        console.error('Error descargando recurso:', error);
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    });
  }

  /**
   * Elimina un archivo seleccionado
   * @param index Índice del archivo a eliminar
   */
  removeSelectedFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.moduleData.files = this.selectedFiles;
  }

  /**
   * Marca un recurso para eliminación (no lo elimina inmediatamente)
   * @param index Índice del recurso a marcar para eliminación
   */
  markResourceForDeletion(index: number) {
    if (!this.resourcesToDelete.includes(index)) {
      this.resourcesToDelete.push(index);
    }
  }

  /**
   * Desmarca un recurso de la eliminación
   * @param index Índice del recurso a desmarcar
   */
  unmarkResourceForDeletion(index: number) {
    const deleteIndex = this.resourcesToDelete.indexOf(index);
    if (deleteIndex > -1) {
      this.resourcesToDelete.splice(deleteIndex, 1);
    }
  }

  /**
   * Verifica si un recurso está marcado para eliminación
   * @param index Índice del recurso
   * @returns true si está marcado para eliminación
   */
  isResourceMarkedForDeletion(index: number): boolean {
    return this.resourcesToDelete.includes(index);
  }

  /**
   * Obtiene los recursos que se mantendrán (excluyendo los marcados para eliminación)
   * @returns Array de recursos que se mantendrán
   */
  getResourcesToKeep(): ModuleResource[] {
    return this.existingResources.filter((_, index) => !this.resourcesToDelete.includes(index));
  }
}
