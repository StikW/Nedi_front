import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { InstructorCourse, CourseStatus } from '../../models/course.model';
import { Module } from '../../models/module.model';
import { CourseStats, StudentProgressResponse } from '../../models/course-stats.model';
import { InstructorStats } from '../../models/instructor-stats.model';
import { PaginatedResponse } from '../../models/paginated-response.model';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
  private readonly apiUrl = environment.apiUrl;
  private courses: InstructorCourse[] = [];
  private coursesSubject = new BehaviorSubject<InstructorCourse[]>([]);
  private courseModulesSubject = new BehaviorSubject<Module[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Cargar cursos al inicializar el servicio
    this.loadCourses();
  }

  /**
   * Cargar cursos desde el backend
   */
  private loadCourses(): void {
    this.http.get<InstructorCourse[]>(`${this.apiUrl}/courses`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(courses => {
        if (courses && courses.length > 0) {
          this.courses = courses;
          this.coursesSubject.next(courses);
        } 
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error cargando cursos:', error);
        this.loadMockCourses();
        return throwError(() => new Error('Error al cargar los cursos'));
      })
    ).subscribe();
  }

  /**
   * Cargar datos mock como fallback
   */
  private loadMockCourses(): void {
    this.courses = [
      {
        id: '1',
        title: 'Introducción a Angular',
        description: 'Aprende los fundamentos del framework Angular',
        category: 'programming',
        level: 'beginner',
        duration: '10 horas',
        price: 49.99,
        imageUrl: 'https://placehold.co/400x300/2563eb/ffffff?text=ISO+9001',
        lastUpdated: new Date(),
        rating: 4.5,
        status: 'published',
        students: 120,
        objectives: 'Aprender los fundamentos de Angular',
        prerequisites: 'Conocimientos básicos de programación'
      }
    ];
    this.coursesSubject.next(this.courses);
  }

  /**
   * Obtener todos los cursos
   */
  getCourses(): Observable<InstructorCourse[]> {
    return this.coursesSubject.asObservable();
  }

  /**
   * Obtener cursos con paginación
   * @param cursor Cursor para la siguiente página
   * @param sortOrder Orden: 'asc' o 'desc'
   * @returns Observable con respuesta paginada
   */
  getCoursesPaginated(cursor?: string, sortOrder: 'asc' | 'desc' = 'desc'): Observable<PaginatedResponse<InstructorCourse>> {
    const headers = this.authService.getAuthHeaders();
    let url = `${this.apiUrl}/courses?sortOrder=${sortOrder}`;
    
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    
    console.log('🌐 Llamando al endpoint paginado:', url);
    
    return this.http.get<PaginatedResponse<InstructorCourse>>(url, { headers }).pipe(
      tap((response) => {
        console.log('📡 Respuesta paginada:', response);
        console.log('📊 Información de paginación:', response.pagination);
        // Actualizar la lista local con los nuevos datos
        if (response.data && response.data.length > 0) {
          this.courses = response.data;
          this.coursesSubject.next(response.data);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error obteniendo cursos paginados:', error);
        return throwError(() => new Error('Error al cargar los cursos'));
      })
    );
  }

  /**
   * Recargar cursos desde el backend
   */
  refreshCourses(): Observable<InstructorCourse[]> {
    return this.http.get<InstructorCourse[]>(`${this.apiUrl}/courses`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(courses => {
        if (courses && courses.length > 0) {
          this.courses = courses;
          this.coursesSubject.next(courses);
        } 
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error recargando cursos:', error);
        return throwError(() => new Error('Error al recargar los cursos'));
      })
    );
  }

  /**
   * Crear un nuevo curso
   */
  createCourse(courseData: Omit<InstructorCourse, 'id' | 'lastUpdated' | 'rating' | 'students'>): Observable<InstructorCourse> {
    return this.http.post<InstructorCourse>(`${this.apiUrl}/courses`, courseData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(newCourse => {
        this.courses = [...this.courses, newCourse];
        this.coursesSubject.next(this.courses);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error creando curso:', error);
        return throwError(() => new Error('Error al crear el curso'));
      })
    );
  }

  /**
   * Actualizar un curso existente
   */
  updateCourse(id: string, courseData: Partial<InstructorCourse>): Observable<InstructorCourse | null> {
    return this.http.put<InstructorCourse>(`${this.apiUrl}/courses/${id}`, courseData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(updatedCourse => {
        const index = this.courses.findIndex(course => course.id === id.toString());
        if (index !== -1) {
          this.courses[index] = updatedCourse;
          this.coursesSubject.next(this.courses);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error actualizando curso:', error);
        return throwError(() => new Error('Error al actualizar el curso'));
      })
    );
  }

  /**
   * Eliminar un curso
   */
  deleteCourse(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/courses/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        this.courses = this.courses.filter(course => course.id !== id.toString());
        this.coursesSubject.next(this.courses);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error eliminando curso:', error);
        return throwError(() => new Error('Error al eliminar el curso'));
      })
    );
  }

  /**
   * Obtener un curso por ID
   */
  getCourseById(id: string): Observable<InstructorCourse | null> {
    return this.http.get<InstructorCourse>(`${this.apiUrl}/courses/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(

      catchError((error: HttpErrorResponse) => {
        console.error('Error obteniendo curso:', error);
        
        if (error.status === 404) {
          const course = this.courses.find(course => course.id === id.toString());
          return of(course || null);
        }
        
        return throwError(() => new Error('Error al obtener el curso'));
      })
    );
  }

  /**
   * Cargar módulos de un curso específico
   */
  loadCourseModules(courseId: string): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.apiUrl}/courses/${courseId}/modules`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(modules => {
        if (modules && modules.length > 0) {
          this.courseModulesSubject.next(modules);
        } else {
          this.courseModulesSubject.next([]);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error cargando módulos del curso:', error);
        this.loadMockModules();
        return throwError(() => new Error('Error al cargar los módulos del curso'));
      })
    );
  }

  /**
   * Obtener módulos con paginación
   * @param courseId ID del curso
   * @param cursor Cursor para la siguiente página
   * @param sortOrder Orden: 'asc' o 'desc'
   * @returns Observable con respuesta paginada
   */
  getModulesPaginated(courseId: string, cursor?: string, sortOrder: 'asc' | 'desc' = 'asc'): Observable<PaginatedResponse<Module>> {
    const headers = this.authService.getAuthHeaders();
    let url = `${this.apiUrl}/courses/${courseId}/modules?sortOrder=${sortOrder}`;
    
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    
    console.log('🌐 Llamando al endpoint de módulos paginados:', url);
    
    return this.http.get<PaginatedResponse<Module>>(url, { headers }).pipe(
      tap((response) => {
        console.log('📡 Respuesta paginada de módulos:', response);
        console.log('📊 Información de paginación de módulos:', response.pagination);
        // Actualizar la lista local con los nuevos datos
        if (response.data && response.data.length > 0) {
          this.courseModulesSubject.next(response.data);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error obteniendo módulos paginados:', error);
        return throwError(() => new Error('Error al cargar los módulos del curso'));
      })
    );
  }

  /**
   * Obtener módulos del curso actual
   */
  getCourseModules(): Observable<Module[]> {
    return this.courseModulesSubject.asObservable();
  }

  /**
   * Recargar módulos de un curso específico
   */
  refreshCourseModules(courseId: string): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.apiUrl}/courses/${courseId}/modules`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(modules => {
        if (modules && modules.length > 0) {
          this.courseModulesSubject.next(modules);
        } else {
          this.courseModulesSubject.next([]);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error recargando módulos del curso:', error);
        return throwError(() => new Error('Error al recargar los módulos del curso'));
      })
    );
  }

  /**
   * Crear un nuevo módulo en un curso
   */
  createModule(courseId: string, moduleData: Omit<Module, 'id'>): Observable<Module> {
    return this.http.post<Module>(`${this.apiUrl}/courses/${courseId}/modules`, moduleData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(newModule => {
        const currentModules = this.courseModulesSubject.value;
        this.courseModulesSubject.next([...currentModules, newModule]);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error creando módulo:', error);
        return throwError(() => new Error('Error al crear el módulo'));
      })
    );
  }

  /**
   * Actualizar un módulo existente
   */
  updateModule(courseId: string, moduleId: string, moduleData: Partial<Module>): Observable<Module> {
    return this.http.put<Module>(`${this.apiUrl}/courses/${courseId}/modules/${moduleId}`, moduleData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(updatedModule => {
        const currentModules = this.courseModulesSubject.value;
        const updatedModules = currentModules.map(module => 
          module.id === moduleId ? updatedModule : module
        );
        this.courseModulesSubject.next(updatedModules);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error actualizando módulo:', error);
        return throwError(() => new Error('Error al actualizar el módulo'));
      })
    );
  }

  /**
   * Eliminar un módulo
   */
  deleteModule(courseId: string, moduleId: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/courses/${courseId}/modules/${moduleId}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        const currentModules = this.courseModulesSubject.value;
        const filteredModules = currentModules.filter(module => module.id !== moduleId);
        this.courseModulesSubject.next(filteredModules);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error eliminando módulo:', error);
        return throwError(() => new Error('Error al eliminar el módulo'));
      })
    );
  }

  /**
   * Cargar datos mock de módulos como fallback
   */
  private loadMockModules(): void {
    const mockModules: Module[] = [
      {
        id: '1',
        order: 1,
        status: 'published',
        title: 'Introducción al Curso',
        description: 'Módulo introductorio que establece los fundamentos del curso'
      },
      {
        id: '2',
        order: 2,
        status: 'published',
        title: 'Conceptos Básicos',
        description: 'Aprende los conceptos fundamentales necesarios para continuar'
      },
      {
        id: '3',
        order: 3,
        status: 'published',
        title: 'Práctica y Ejercicios',
        description: 'Aplica lo aprendido con ejercicios prácticos y proyectos'
      }
    ];
    this.courseModulesSubject.next(mockModules);
  }

  /**
   * Obtiene las estadísticas de progreso de estudiantes de un curso
   * @param courseId ID del curso
   * @returns Observable con las estadísticas del curso
   */
  getCourseStats(courseId: string): Observable<CourseStats> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.get<CourseStats>(`${this.apiUrl}/courses/${courseId}/stats`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error obteniendo estadísticas del curso:', error);
        return throwError(() => new Error('Error al cargar las estadísticas del curso'));
      })
    );
  }

  /**
   * Obtiene las estadísticas generales del instructor
   * @returns Observable con las estadísticas del instructor
   */
  getInstructorStats(): Observable<InstructorStats> {
    const headers = this.authService.getAuthHeaders();
    const url = `${this.apiUrl}/courses/instructor/stats`;
    
    console.log('🌐 Llamando al endpoint:', url);
    console.log('🔑 Headers de autenticación:', headers);
    
    return this.http.get<InstructorStats>(url, { headers }).pipe(
      tap((stats) => {
        console.log('📡 Respuesta del endpoint instructor/stats:', stats);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error obteniendo estadísticas del instructor:', error);
        console.error('📊 Status:', error.status);
        console.error('📝 Mensaje:', error.message);
        console.error('🔍 URL:', error.url);
        return throwError(() => new Error('Error al cargar las estadísticas del instructor'));
      })
    );
  }

  /**
   * Obtiene el progreso de estudiantes de un curso con paginación
   * @param courseId ID del curso
   * @param cursor Cursor para la siguiente página
   * @param sortOrder Orden: 'asc' o 'desc'
   * @param page Número de página
   * @returns Observable con respuesta paginada del progreso de estudiantes
   */
  getStudentProgressPaginated(courseId: string, cursor?: string, sortOrder: 'asc' | 'desc' = 'desc', page?: number): Observable<StudentProgressResponse> {
    const headers = this.authService.getAuthHeaders();
    let url = `${this.apiUrl}/courses/${courseId}/student-progress?sortOrder=${sortOrder}`;
    
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    
    if (page !== undefined) {
      url += `&page=${page}`;
    }
    
    console.log('🌐 Llamando al endpoint de progreso de estudiantes:', url);
    
    return this.http.get<StudentProgressResponse>(url, { headers }).pipe(
      tap((response) => {
        console.log('📡 Respuesta paginada de progreso de estudiantes:', response);
        console.log('📊 Información de paginación:', response.pagination);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error obteniendo progreso de estudiantes:', error);
        return throwError(() => new Error('Error al cargar el progreso de estudiantes'));
      })
    );
  }
} 