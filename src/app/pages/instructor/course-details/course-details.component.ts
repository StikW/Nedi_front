import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin, of, firstValueFrom } from 'rxjs';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { ModuleCardComponent } from '../../../components/module-card/module-card.component';
import { ModuleModalComponent, ModuleFormData } from '../../../components/module-modal/module-modal.component';
import { CourseStudentsComponent } from '../course-students/course-students.component';
import { CourseEditorComponent } from '../course-editor/course-editor.component';

import { Module, ModuleStatus, ModuleResource } from '../../../models/module.model';
import { InstructorCourse, CourseStatus } from '../../../models/course.model';
import { CourseStats, StudentProgress, StudentProgressResponse } from '../../../models/course-stats.model';
import { PaginatedResponse } from '../../../models/paginated-response.model';
import { CoursesService } from '../courses.service';
import { UploadsService } from '../../../core/services/uploads.service';
import { environment } from '../../../../environments/environment';
import { getPublicAppOrigin } from '../../../core/utils/app-origin';
import { RuntimeConfigService } from '../../../core/services/runtime-config.service';
import { DialogService } from '../../../core/services/dialog.service';

function effectiveCourseVisibility(course: InstructorCourse): 'public' | 'private' {
  return course.visibility === 'public' ? 'public' : 'private';
}

type CoursePanel = 'none' | 'progress' | 'students' | 'edit';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    NavbarComponent,
    ModuleCardComponent,
    ModuleModalComponent,
    CourseStudentsComponent,
    CourseEditorComponent,
  ],
  templateUrl: './course-details.component.html',
  styleUrls: ['./course-details.component.scss']
})
export class CourseDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  course: InstructorCourse | null = null;
  courseId: string | undefined;
  isLoading = true;
  error: string | null = null;
  isTogglingPublish = false;
  shareCopied = false;



  // Module management
  modules: Module[] = [];
  showAddModuleModal: boolean = false;
  showEditModuleModal: boolean = false;
  isSubmittingModule: boolean = false;
  isUpdatingModule: boolean = false;
  selectedModule: Module | undefined = undefined;

  // Module pagination
  currentModuleCursor?: string;
  nextModuleCursor?: string;
  hasNextModule: boolean = false;
  isLoadingModules: boolean = false;
  moduleSortOrder: 'asc' | 'desc' = 'asc';
  
  // Navigation history for cursor-based pagination
  moduleCursorHistory: string[] = [];
  currentModulePageIndex: number = 0;

  // Course stats
  courseStats: CourseStats | null = null;
  isLoadingStats = false;
  statsError: string | null = null;

  // Student progress pagination
  studentProgress: StudentProgress[] = [];
  currentStudentPage: string = '1';
  hasNextStudent: boolean = false;
  hasPrevStudent: boolean = false;
  isLoadingStudentProgress: boolean = false;
  studentSortOrder: 'asc' | 'desc' = 'desc';

  // Panel inferior: contenido del curso | progreso | estudiantes | editar
  coursePanel: CoursePanel = 'none';
  metricsDataLoaded = false;
  studentPageSize = 50;
  tableSort: 'progress' | 'progress-asc' | 'name' | 'activity' | 'enrolled' = 'progress';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private coursesService: CoursesService,
    private uploadsService: UploadsService,
    private runtimeConfig: RuntimeConfigService,
    private dialogService: DialogService,
  ) {}

  ngOnInit() {
    this.loadCourseData();
    this.loadModules();
    this.syncPanelFromRoute();

    // Suscribirse a cambios en los módulos del servicio
    this.coursesService.getCourseModules().pipe(
      takeUntil(this.destroy$)
    ).subscribe(modules => {
      this.modules = modules;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar datos del curso basándose en el ID de la ruta
   */
  loadCourseData() {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.courseId = params['id'];
      if (this.courseId) {
        this.isLoading = true;
        this.error = null;

        this.coursesService.getCourseById(this.courseId).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (course) => {
            if (course) {
              this.course = course;
              this.isLoading = false;
            } else {
              console.error('Curso no encontrado');
              this.error = 'Curso no encontrado';
              this.isLoading = false;
            }
          },
          error: (error) => {
            console.error('Error cargando curso:', error);
            this.error = 'Error al cargar el curso';
            this.isLoading = false;
          }
        });
      } else {
        this.error = 'ID de curso no válido';
        this.isLoading = false;
      }
    });
  }

  /** Enlace público de inscripción; usa el host actual (tututor.co o www.tututor.co) */
  get publicJoinLink(): string {
    if (!this.course?.id) return '';
    const base = getPublicAppOrigin(environment.publicAppUrl);
    return `${base}/join/${this.course.id}`;
  }

  get showShareButton(): boolean {
    return (
      this.course?.visibility === 'public' &&
      this.course?.status === 'published'
    );
  }

  copyShareLink(): void {
    const url = this.publicJoinLink;
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      this.shareCopied = true;
      setTimeout(() => (this.shareCopied = false), 2500);
    });
  }

  getStatusLabel(status: CourseStatus): string {
    const statusLabels: Record<CourseStatus, string> = {
      'draft': 'Borrador',
      'published': 'Publicado',
      'archived': 'Archivado'
    };
    return statusLabels[status] || status;
  }

  getVisibilityLabel(course: InstructorCourse): string {
    return effectiveCourseVisibility(course) === 'public' ? 'Público' : 'Privado';
  }

  visibilityBadgeClass(course: InstructorCourse): string {
    return effectiveCourseVisibility(course) === 'public' ? 'visibility-public' : 'visibility-private';
  }

  getOverviewLines(value?: string): string[] {
    return (value ?? '')
      .split('\n')
      .map((line) => line.trim().replace(/^[-–—•*]\s*/, ''))
      .filter(Boolean);
  }

  togglePublish() {
    if (!this.course || !this.courseId || this.isTogglingPublish) {
      return;
    }

    this.isTogglingPublish = true;
    const newStatus: CourseStatus = this.course.status === 'published' ? 'draft' : 'published';
    
    this.coursesService.updateCourse(this.courseId, { status: newStatus }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedCourse) => {
        if (updatedCourse) {
          this.course = {
            ...this.course!,
            ...updatedCourse
          };
        }
        this.isTogglingPublish = false;
      },
      error: (error) => {
        console.error('Error actualizando estado del curso:', error);
        this.isTogglingPublish = false;
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    });
  }



  private loadModules(cursor?: string, isGoingBack: boolean = false) {
    if (!this.courseId) {
      return;
    }

    this.isLoadingModules = true;

    this.coursesService.getModulesPaginated(this.courseId, cursor, this.moduleSortOrder).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: PaginatedResponse<Module>) => {
        this.modules = response.data;
        this.nextModuleCursor = response.pagination.nextCursor;
        this.hasNextModule = response.pagination.hasNext;
        this.currentModuleCursor = cursor;
        this.isLoadingModules = false;
        
        // Manejar historial de cursors
        this.updateModuleCursorHistory(cursor, isGoingBack);
        
        console.log('✅ Módulos cargados:', {
          count: response.data.length,
          hasNext: response.pagination.hasNext,
          nextCursor: response.pagination.nextCursor,
          limit: response.pagination.limit,
          sortOrder: response.pagination.sortOrder,
          currentPageIndex: this.currentModulePageIndex,
          pageNumber: this.currentModulePageIndex + 1,
          historyLength: this.moduleCursorHistory.length,
          cursorHistory: this.moduleCursorHistory,
          isGoingBack: isGoingBack
        });
      },
      error: (error) => {
        console.error('❌ Error loading modules:', error);
        this.isLoadingModules = false;
        // Los módulos se mantienen como array vacío en caso de error
      }
    });
  }

  private loadCourseStats() {
    if (!this.courseId) {
      return;
    }

    this.isLoadingStats = true;
    this.statsError = null;

    this.coursesService.getCourseStats(this.courseId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.courseStats = stats;
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
        this.statsError = 'Error al cargar las estadísticas';
        this.isLoadingStats = false;
      }
    });
  }

  openAddModuleModal() {
    this.showAddModuleModal = true;
  }

  closeAddModuleModal() {
    this.showAddModuleModal = false;
  }

  openEditModuleModal(module: Module) {
    this.selectedModule = module;
    this.showEditModuleModal = true;
  }

  closeEditModuleModal() {
    this.showEditModuleModal = false;
    this.selectedModule = undefined;
  }

  handleModuleSubmit(moduleData: ModuleFormData) {
    if (!this.courseId) {
      return;
    }

    this.isSubmittingModule = true;

    const moduleFormData: any = {
      title: moduleData.title,
      description: moduleData.description,
      order: this.modules.length + 1,
      status: 'published' as ModuleStatus
    };

    // Agregar URL del video si existe (se envía como 'content' al backend)
    if (moduleData.videoUrl) {
      moduleFormData.content = moduleData.videoUrl;
    }

    // Primero crear el módulo
    this.coursesService.createModule(this.courseId, moduleFormData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (newModule) => {
        // Si hay archivos para subir, procesarlos
        if (moduleData.files && moduleData.files.length > 0) {
          this.uploadModuleResources(newModule.id, moduleData.files);
        } else {
          // Si no hay archivos, solo actualizar la lista local
          this.modules = [...this.modules, newModule];
          this.closeAddModuleModal();
          this.isSubmittingModule = false;
        }
      },
      error: (error) => {
        console.error('Error creando módulo:', error);
        this.isSubmittingModule = false;
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    });
  }

  /**
   * Sube los recursos de un módulo y actualiza el módulo con las URLs de los recursos
   * @param moduleId ID del módulo
   * @param files Archivos a subir
   */
  private uploadModuleResources(moduleId: string, files: File[]) {
    if (!this.courseId) {
      console.error('CourseId no disponible para subir recursos');
      this.isSubmittingModule = false;
      return;
    }

    const uploadObservables = files.map(file => 
      this.uploadsService.uploadModuleFileWithPresignedUrl(this.courseId!, moduleId, file)
    );

    forkJoin(uploadObservables).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: async (uploadResults) => {
        // Confirmar cada archivo subido
        const confirmObservables = uploadResults.map(result => {
          if (result.fileKey) {
            return this.uploadsService.confirmModuleFileUpload(this.courseId!, moduleId);
          }
          return of({ success: false, message: 'No se pudo confirmar la subida del archivo' });
        });
        try {
          await firstValueFrom(forkJoin(confirmObservables));
          // Crear array de recursos con las URLs de los archivos subidos
          const baseUrl = this.runtimeConfig.getS3ModulesBaseUrl();
          const resources: ModuleResource[] = uploadResults.map((result, index) => ({
            name: files[index].name,
            url: `${baseUrl}/${result.fileKey || ''}`,
            size: files[index].size
          }));

          // Actualizar el módulo con los recursos
          this.updateModuleWithResources(moduleId, resources);
        } catch (error) {
          console.error('Error confirmando archivos:', error);
          this.isSubmittingModule = false;
        }

      },
      error: (error) => {
        console.error('Error subiendo recursos del módulo:', error);
        this.isSubmittingModule = false;
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    });
  }

  /**
   * Actualiza un módulo con sus recursos
   * @param moduleId ID del módulo
   * @param resources Recursos del módulo
   */
  private updateModuleWithResources(moduleId: string, resources: ModuleResource[]) {
    if (!this.courseId) {
      return;
    }

    // Encontrar el módulo en la lista local
    const moduleIndex = this.modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) {
      console.error('Módulo no encontrado para actualizar recursos');
      this.isSubmittingModule = false;
      return;
    }

    const currentModule = this.modules[moduleIndex];
    const updatedModuleData: any = {
      title: currentModule.title,
      description: currentModule.description,
      order: currentModule.order,
      status: currentModule.status as ModuleStatus,
      resources: resources
    };

    // Preservar la URL del video si existe (se envía como 'content' al backend)
    if ((currentModule as any).videoUrl || (currentModule as any).content) {
      updatedModuleData.content = (currentModule as any).videoUrl || (currentModule as any).content;
    }

    this.coursesService.updateModule(this.courseId, moduleId, updatedModuleData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedModule) => {
        // Actualizar el módulo en la lista local
        this.modules[moduleIndex] = updatedModule;
        this.closeAddModuleModal();
        this.isSubmittingModule = false;
      },
      error: (error) => {
        console.error('Error actualizando módulo con recursos:', error);
        this.isSubmittingModule = false;
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    });
  }

  handleModuleUpdate(moduleData: ModuleFormData) {
    if (!this.courseId || this.selectedModule === undefined) {
      return;
    }

    this.isUpdatingModule = true;

    const moduleFormData: any = {
      title: moduleData.title,
      description: moduleData.description,
      order: this.selectedModule.order,
      status: this.selectedModule.status as ModuleStatus
    };

    // Agregar URL del video si existe (se envía como 'content' al backend)
    if (moduleData.videoUrl) {
      moduleFormData.content = moduleData.videoUrl;
    }

    // Obtener recursos que se mantendrán del modal (excluyendo los marcados para eliminación)
    const resourcesToKeep = moduleData.resourcesToKeep || [];

    // Si hay archivos nuevos para subir, procesarlos primero
    if (moduleData.files && moduleData.files.length > 0) {
      this.uploadModuleResourcesForUpdate(this.selectedModule.id, moduleData.files, moduleFormData, resourcesToKeep);
    } else {
      // Si no hay archivos nuevos, solo actualizar el módulo con recursos que se mantienen
      const updatedModuleData = {
        ...moduleFormData,
        resources: resourcesToKeep
      };
      this.updateModuleOnly(updatedModuleData);
    }
  }

  /**
   * Sube recursos para un módulo existente y luego actualiza el módulo
   * @param moduleId ID del módulo
   * @param files Archivos a subir
   * @param moduleFormData Datos del módulo a actualizar
   * @param existingResources Recursos existentes que se mantienen
   */
  private uploadModuleResourcesForUpdate(moduleId: string, files: File[], moduleFormData: any, existingResources: ModuleResource[] = []) {
    if (!this.courseId) {
      console.error('CourseId no disponible para subir recursos');
      this.isUpdatingModule = false;
      return;
    }

    // Si no hay archivos nuevos para subir, solo actualizar con recursos existentes
    if (files.length === 0) {
      const updatedModuleData = {
        ...moduleFormData,
        resources: existingResources
      };
      this.updateModuleOnly(updatedModuleData);
      return;
    }

    const uploadObservables = files.map(file => 
      this.uploadsService.uploadModuleFileWithPresignedUrl(this.courseId!, moduleId, file)
    );

    forkJoin(uploadObservables).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: async (uploadResults) => {
        const baseUrl = this.runtimeConfig.getS3ModulesBaseUrl();
        const newResources: ModuleResource[] = uploadResults.map((result, index) => ({
          name: files[index].name,
          url: `${baseUrl}/${result.fileKey || ''}`,
          size: files[index].size
        }));

        const allResources = [...existingResources, ...newResources];
        const updatedModuleData = {
          ...moduleFormData,
          resources: allResources
        };

        try {
          // 1. Actualizar módulo (backend elimina PDFs que ya no están en resources)
          await firstValueFrom(
            this.coursesService.updateModule(this.courseId!, moduleId, updatedModuleData),
          );
          // 2. Re-vectorizar solo con los archivos que quedaron en S3
          await firstValueFrom(this.uploadsService.confirmModuleFileUpload(this.courseId!, moduleId));

          const moduleIndex = this.modules.findIndex(m => m.id === moduleId);
          if (moduleIndex !== -1) {
            this.modules[moduleIndex] = { ...this.modules[moduleIndex], ...updatedModuleData };
          }
          this.closeEditModuleModal();
          this.isUpdatingModule = false;
        } catch (error) {
          console.error('Error actualizando módulo con recursos:', error);
          this.isUpdatingModule = false;
        }
      },
      error: (error) => {
        console.error('Error subiendo recursos del módulo:', error);
        this.isUpdatingModule = false;
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    });
  }

  /**
   * Actualiza solo los datos del módulo sin recursos
   * @param moduleFormData Datos del módulo a actualizar
   */
  private updateModuleOnly(moduleFormData: any) {
    if (!this.courseId || this.selectedModule === undefined) {
      return;
    }

    this.coursesService.updateModule(this.courseId, this.selectedModule.id, moduleFormData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedModule) => {
        const index = this.modules.findIndex(m => m.id === updatedModule.id);
        if (index !== -1) {
          this.modules[index] = updatedModule;
        }

        if (moduleFormData.resources !== undefined && this.courseId) {
          this.uploadsService.confirmModuleFileUpload(this.courseId, updatedModule.id).pipe(
            takeUntil(this.destroy$)
          ).subscribe({
            error: (err) => console.error('Error re-vectorizando módulo tras actualizar recursos:', err),
          });
        }

        this.closeEditModuleModal();
        this.isUpdatingModule = false;
      },
      error: (error) => {
        console.error('Error actualizando módulo:', error);
        this.isUpdatingModule = false;
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    });
  }

  deleteModule(moduleId: string) {
    if (!this.courseId) {
      return;
    }

    this.coursesService.deleteModule(this.courseId, moduleId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        // El servicio ya actualiza el estado interno, pero también actualizamos localmente
        this.modules = this.modules.filter(module => module.id !== moduleId);
      },
      error: (error) => {
        console.error('Error eliminando módulo:', error);
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    });
  }

  refreshModules() {
    if (!this.courseId) {
      return;
    }

    this.coursesService.refreshCourseModules(this.courseId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (modules) => {
        this.modules = modules;
      },
      error: (error) => {
        console.error('Error recargando módulos:', error);
      }
    });
  }

  // Métodos de paginación para módulos
  loadNextModulePage(): void {
    if (this.hasNextModule && this.nextModuleCursor && !this.isLoadingModules) {
      this.loadModules(this.nextModuleCursor, false);
    }
  }

  loadPreviousModulePage(): void {
    if (!this.isLoadingModules && this.canGoBackModule()) {
      this.currentModulePageIndex--;
      const previousCursor = this.moduleCursorHistory[this.currentModulePageIndex];
      this.loadModules(previousCursor, true);
    }
  }

  // Métodos para manejar historial de cursors de módulos
  private updateModuleCursorHistory(cursor: string | undefined, isGoingBack: boolean): void {
    if (isGoingBack) {
      // Ya estamos navegando hacia atrás, no modificar el historial
      return;
    }

    if (cursor === undefined) {
      // Primera página - inicializar historial con página 1
      this.moduleCursorHistory = [''];
      this.currentModulePageIndex = 0;
    } else {
      // Si estamos navegando hacia adelante desde una posición anterior
      if (this.currentModulePageIndex < this.moduleCursorHistory.length - 1) {
        // Truncar el historial desde la posición actual
        this.moduleCursorHistory = this.moduleCursorHistory.slice(0, this.currentModulePageIndex + 1);
      }
      
      // Agregar el nuevo cursor al historial
      this.moduleCursorHistory.push(cursor);
      this.currentModulePageIndex = this.moduleCursorHistory.length - 1;
    }
  }

  canGoBackModule(): boolean {
    return this.currentModulePageIndex > 0;
  }

  changeModuleSortOrder(newOrder: 'asc' | 'desc'): void {
    if (this.moduleSortOrder !== newOrder) {
      this.moduleSortOrder = newOrder;
      this.loadModules(); // Recargar con nuevo orden
    }
  }

  refreshStats() {
    this.loadCourseStats();
  }

  refreshMetrics(): void {
    this.metricsDataLoaded = false;
    this.loadMetricsData(true);
  }

  get showAdvancedMetrics(): boolean {
    return this.coursePanel === 'progress';
  }

  get showStudentsPanel(): boolean {
    return this.coursePanel === 'students';
  }

  get showEditPanel(): boolean {
    return this.coursePanel === 'edit';
  }

  private syncPanelFromRoute(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const panel = data['panel'] as CoursePanel | undefined;
      if (panel && panel !== 'none') {
        this.setCoursePanel(panel, { skipUrlUpdate: true });
      }
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const panel = params['panel'] as CoursePanel | undefined;
      if (panel && panel !== 'none') {
        this.setCoursePanel(panel, { skipUrlUpdate: true });
      }
    });
  }

  setCoursePanel(panel: CoursePanel, options?: { skipUrlUpdate?: boolean }): void {
    this.coursePanel = panel;

    if (panel === 'progress' && !this.metricsDataLoaded) {
      this.loadMetricsData();
    }

    if (options?.skipUrlUpdate) {
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: panel === 'none' ? { panel: null } : { panel },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  toggleProgressPanel(): void {
    this.setCoursePanel(this.coursePanel === 'progress' ? 'none' : 'progress');
  }

  toggleStudentsPanel(): void {
    this.setCoursePanel(this.coursePanel === 'students' ? 'none' : 'students');
  }

  closeCoursePanel(): void {
    this.setCoursePanel('none');
  }

  onCourseSaved(course: InstructorCourse): void {
    this.course = course;
    this.setCoursePanel('none');
  }

  onCourseEditCancelled(): void {
    this.setCoursePanel('none');
  }

  onStudentsChanged(): void {
    this.metricsDataLoaded = false;
    if (this.coursePanel === 'progress') {
      this.loadMetricsData(true);
    }
  }

  private loadMetricsData(force = false): void {
    if (!this.courseId) return;
    if (this.metricsDataLoaded && !force) return;
    this.loadCourseStats();
    this.loadStudentProgress('1');
  }

  private loadStudentProgress(page?: string) {
    if (!this.courseId) {
      return;
    }

    this.isLoadingStudentProgress = true;

    // Usar la página proporcionada o la página actual
    const pageToLoad = page || this.currentStudentPage;

    this.coursesService.getStudentProgressPaginated(
      this.courseId,
      undefined,
      this.studentSortOrder,
      parseInt(pageToLoad),
      this.studentPageSize,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: StudentProgressResponse) => {
        this.studentProgress = response.studentProgress;
        this.hasNextStudent = response.pagination.hasNext;
        this.hasPrevStudent = response.pagination.hasPrev;
        this.currentStudentPage = response.pagination.page;
        this.isLoadingStudentProgress = false;
        this.metricsDataLoaded = true;

        console.log('✅ Progreso de estudiantes cargado:', {
          count: response.studentProgress.length,
          hasNext: response.pagination.hasNext,
          hasPrev: response.pagination.hasPrev,
          currentPage: this.currentStudentPage,
          totalPages: response.pagination.totalPages,
          pageToLoad: pageToLoad
        });
      },
      error: (error) => {
        console.error('❌ Error loading student progress:', error);
        this.isLoadingStudentProgress = false;
      }
    });
  }

  // Métodos de paginación para progreso de estudiantes
  loadNextStudentPage(): void {
    if (this.hasNextStudent && !this.isLoadingStudentProgress) {
      const nextPage = (parseInt(this.currentStudentPage) + 1).toString();
      this.loadStudentProgress(nextPage);
    }
  }

  loadPreviousStudentPage(): void {
    if (this.hasPrevStudent && !this.isLoadingStudentProgress) {
      const prevPage = (parseInt(this.currentStudentPage) - 1).toString();
      this.loadStudentProgress(prevPage);
    }
  }

  canGoBackStudent(): boolean {
    return this.hasPrevStudent;
  }

  changeStudentSortOrder(newOrder: 'asc' | 'desc'): void {
    if (this.studentSortOrder !== newOrder) {
      this.studentSortOrder = newOrder;
      this.loadStudentProgress();
    }
  }

  onTableSortChange(): void {
    // Ordenación en cliente sobre la página actual
  }

  get displayedStudents(): StudentProgress[] {
    const list = [...this.studentProgress];
    switch (this.tableSort) {
      case 'progress':
        return list.sort((a, b) => b.completionPercentage - a.completionPercentage);
      case 'progress-asc':
        return list.sort((a, b) => a.completionPercentage - b.completionPercentage);
      case 'name':
        return list.sort((a, b) => a.studentName.localeCompare(b.studentName, 'es'));
      case 'activity':
        return list.sort((a, b) => this.accessTimestamp(b) - this.accessTimestamp(a));
      case 'enrolled':
        return list.sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime());
      default:
        return list;
    }
  }

  get notStartedCount(): number {
    return this.studentProgress.filter((s) => s.completedModules === 0).length;
  }

  get inProgressCount(): number {
    return this.studentProgress.filter(
      (s) => s.completedModules > 0 && s.completionPercentage < 100,
    ).length;
  }

  get activeRecentlyCount(): number {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return this.studentProgress.filter((s) => this.accessTimestamp(s) >= weekAgo).length;
  }

  get avgLoginCount(): number {
    if (this.studentProgress.length === 0) return 0;
    const sum = this.studentProgress.reduce((acc, s) => acc + (this.getLoginCount(s) ?? 0), 0);
    return sum / this.studentProgress.length;
  }

  getStudentInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getStudentStatus(student: StudentProgress): 'completed' | 'in_progress' | 'not_started' {
    if (student.completionPercentage >= 100) return 'completed';
    if (student.completedModules === 0) return 'not_started';
    return 'in_progress';
  }

  getStudentStatusLabel(student: StudentProgress): string {
    const status = this.getStudentStatus(student);
    if (status === 'completed') return 'Completado';
    if (status === 'not_started') return 'Sin iniciar';
    return 'En progreso';
  }

  getModuleDots(student: StudentProgress): boolean[] {
    const total = student.totalModules || 0;
    const done = student.completedModules || 0;
    return Array.from({ length: total }, (_, i) => i < done);
  }

  formatRelativeAccess(dateStr?: string): string {
    if (!dateStr) return 'Sin registro';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'Sin registro';
    const diffMs = Date.now() - date.getTime();
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (days <= 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} sem.`;
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  }

  private accessTimestamp(student: StudentProgress): number {
    if (!student.lastAccessAt) return 0;
    const t = new Date(student.lastAccessAt).getTime();
    return Number.isNaN(t) ? 0 : t;
  }

  /** Distribución de estudiantes por rango de progreso (para gráfico de barras) */
  get distributionBuckets(): { label: string; count: number; percent: number }[] {
    const buckets = [
      { label: '0-25%', min: 0, max: 25, count: 0 },
      { label: '25-50%', min: 25, max: 50, count: 0 },
      { label: '50-75%', min: 50, max: 75, count: 0 },
      { label: '75-100%', min: 75, max: 101, count: 0 },
    ];
    for (const s of this.studentProgress) {
      const p = s.completionPercentage;
      const b = buckets.find((x) => p >= x.min && p < x.max);
      if (b) b.count++;
    }
    const total = this.studentProgress.length || 1;
    return buckets.map((b) => ({
      label: b.label,
      count: b.count,
      percent: total ? (b.count / total) * 100 : 0,
    }));
  }

  /** Cantidad de estudiantes que completaron el 100% */
  get completedCount(): number {
    return this.studentProgress.filter((s) => s.completionPercentage >= 100).length;
  }

  /** Promedio de módulos completados por estudiante */
  get avgModulesCompleted(): number {
    if (this.studentProgress.length === 0) return 0;
    const sum = this.studentProgress.reduce((acc, s) => acc + s.completedModules, 0);
    return sum / this.studentProgress.length;
  }

  /** Diferencia vs promedio del curso (positivo = por encima, negativo = por debajo). Null si no hay promedio. */
  getVsPromedio(student: StudentProgress): number | null {
    const avg = this.courseStats?.completionRate;
    if (avg == null) return null;
    return Math.round(student.completionPercentage - avg);
  }

  /** Veces que el estudiante ingresó al sistema. Null si el backend aún no envía loginCount. */
  getLoginCount(student: StudentProgress): number | null {
    if (student.loginCount != null && typeof student.loginCount === 'number') {
      return student.loginCount;
    }
    return null;
  }

  // Event handlers for module-card component
  onEditModule(module: Module) {
    this.openEditModuleModal(module);
  }

  onDeleteModule(moduleId: string) {
    this.deleteModule(moduleId);
  }

  onViewModule(module: Module) {
    // TODO: Implementar vista detallada del módulo
    console.log('Viendo módulo:', module);
    // Aquí podrías navegar a una página de detalles del módulo
  }



  openConfigureAgentModal() {
    this.router.navigate(['/instructor/agent-config']);
  }

} 