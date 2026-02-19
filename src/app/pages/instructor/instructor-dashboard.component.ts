import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { InstructorCourseListComponent } from '../../components/instructor-course-list/instructor-course-list.component';
import { InstructorCourse } from '../../models/course.model';
import { InstructorStats } from '../../models/instructor-stats.model';
import { PaginatedResponse } from '../../models/paginated-response.model';
import { CoursesService } from './courses.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, InstructorCourseListComponent],
  templateUrl: './instructor-dashboard.component.html',
  styleUrls: ['./instructor-dashboard.component.css']
})
export class InstructorDashboardComponent implements OnInit, OnDestroy {
  // Stats
  instructorStats: InstructorStats | null = null;
  totalCourses: number = 0;
  totalStudents: number = 0;

  // Courses
  courses: InstructorCourse[] = [];

  // Pagination
  currentCursor?: string;
  nextCursor?: string;
  hasNext: boolean = false;
  isLoadingCourses: boolean = false;
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Navigation history for cursor-based pagination
  cursorHistory: string[] = [];
  currentPageIndex: number = 0;


  private coursesSubscription?: Subscription;

  constructor(
    private coursesService: CoursesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Cargar estadísticas del endpoint primero
    this.loadInstructorStats();
    // Luego cargar cursos (que solo usará fallback si no hay stats del endpoint)
    this.loadCourses();
  }

  ngOnDestroy(): void {
    this.coursesSubscription?.unsubscribe();
  }

  private loadCourses(cursor?: string, isGoingBack: boolean = false): void {
    this.isLoadingCourses = true;
    
    this.coursesService.getCoursesPaginated(cursor, this.sortOrder).subscribe({
      next: (response: PaginatedResponse<InstructorCourse>) => {
        this.courses = response.data;
        this.nextCursor = response.pagination.nextCursor;
        this.hasNext = response.pagination.hasNext;
        this.currentCursor = cursor;
        this.isLoadingCourses = false;
        
        // Manejar historial de cursors
        this.updateCursorHistory(cursor, isGoingBack);
        
        console.log('✅ Cursos cargados:', {
          count: response.data.length,
          hasNext: response.pagination.hasNext,
          nextCursor: response.pagination.nextCursor,
          limit: response.pagination.limit,
          sortOrder: response.pagination.sortOrder,
          currentPageIndex: this.currentPageIndex,
          pageNumber: this.currentPageIndex + 1,
          historyLength: this.cursorHistory.length,
          cursorHistory: this.cursorHistory,
          isGoingBack: isGoingBack
        });
      },
      error: (error) => {
        console.error('❌ Error loading courses:', error);
        this.isLoadingCourses = false;
        // TODO: Show error message to user
      }
    });
  }

  private loadInstructorStats(): void {
    console.log('🔄 Cargando estadísticas del instructor...');
    this.coursesService.getInstructorStats().subscribe({
      next: (stats) => {
        console.log('✅ Estadísticas del instructor cargadas:', stats);
        this.instructorStats = stats;
        this.updateStatsFromAPI(stats);
        console.log('📊 Datos actualizados:', {
          totalCourses: this.totalCourses,
          totalStudents: this.totalStudents
        });
      },
      error: (error) => {
        console.error('❌ Error loading instructor stats:', error);
        // Si falla el endpoint, mostrar valores por defecto
        this.totalCourses = 0;
        this.totalStudents = 0;
        console.log('⚠️ Usando valores por defecto debido a error del endpoint');
      }
    });
  }

  private updateStatsFromAPI(stats: InstructorStats): void {
    this.totalCourses = stats.totalCourses;
    this.totalStudents = stats.totalStudents;
  }

  // Métodos de fallback eliminados - ahora solo usamos datos del endpoint instructor/stats


  // Métodos de paginación
  loadNextPage(): void {
    if (this.hasNext && this.nextCursor && !this.isLoadingCourses) {
      this.loadCourses(this.nextCursor, false);
    }
  }

  loadPreviousPage(): void {
    if (!this.isLoadingCourses && this.canGoBack()) {
      this.currentPageIndex--;
      const previousCursor = this.cursorHistory[this.currentPageIndex];
      this.loadCourses(previousCursor, true);
    }
  }

  // Métodos para manejar historial de cursors
  private updateCursorHistory(cursor: string | undefined, isGoingBack: boolean): void {
    if (isGoingBack) {
      // Ya estamos navegando hacia atrás, no modificar el historial
      return;
    }

    if (cursor === undefined) {
      // Primera página - inicializar historial con página 1
      this.cursorHistory = [''];
      this.currentPageIndex = 0;
    } else {
      // Si estamos navegando hacia adelante desde una posición anterior
      if (this.currentPageIndex < this.cursorHistory.length - 1) {
        // Truncar el historial desde la posición actual
        this.cursorHistory = this.cursorHistory.slice(0, this.currentPageIndex + 1);
      }
      
      // Agregar el nuevo cursor al historial
      this.cursorHistory.push(cursor);
      this.currentPageIndex = this.cursorHistory.length - 1;
    }
  }

  canGoBack(): boolean {
    return this.currentPageIndex > 0;
  }


  changeSortOrder(newOrder: 'asc' | 'desc'): void {
    if (this.sortOrder !== newOrder) {
      this.sortOrder = newOrder;
      this.loadCourses(); // Recargar con nuevo orden
    }
  }

  openConfigureAgentModal(): void {
    // Navegamos a la configuración global del agente del instructor
    this.router.navigate(['/instructor/agent-config']);
  }

  deleteCourse(courseId: string): void {
    const course = this.courses.find(c => c.id === courseId);
    const courseTitle = course?.title || 'este curso';
    
    if (confirm(`¿Estás seguro de que quieres eliminar "${courseTitle}"? Esta acción no se puede deshacer.`)) {
      this.coursesService.deleteCourse(courseId).subscribe({
        next: () => {
          // El servicio ya actualiza la lista automáticamente
          console.log('Curso eliminado exitosamente');
        },
        error: (error) => {
          console.error('Error eliminando curso:', error);
          alert('Error al eliminar el curso. Por favor, inténtalo de nuevo.');
        }
      });
    }
  }
} 