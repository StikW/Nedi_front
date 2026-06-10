import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Student } from '../../models/student.model';
import { PaginatedResponse } from '../../models/paginated-response.model';
import { ImportResult } from '../../models/import-result.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StudentsService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Obtiene la lista de estudiantes de un curso específico
   * @param courseId ID del curso
   * @returns Observable con la lista de estudiantes
   */
  getStudentsByCourse(courseId: string): Observable<Student[]> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.get<Student[]>(`${this.apiUrl}/students/course/${courseId}`, { headers }).pipe(
      catchError((error) => {
        console.error('Error cargando estudiantes:', error);
        return throwError(() => new Error('Error al cargar los estudiantes'));
      })
    );
  }

  /**
   * Obtiene estudiantes con paginación
   * @param courseId ID del curso
   * @param cursor Cursor para la siguiente página
   * @param sortOrder Orden: 'asc' o 'desc'
   * @returns Observable con respuesta paginada
   */
  getStudentsPaginated(courseId: string, cursor?: string, sortOrder: 'asc' | 'desc' = 'asc'): Observable<PaginatedResponse<Student>> {
    const headers = this.authService.getAuthHeaders();
    let url = `${this.apiUrl}/students/course/${courseId}?sortOrder=${sortOrder}`;
    
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    
    console.log('🌐 Llamando al endpoint de estudiantes paginados:', url);
    
    return this.http.get<PaginatedResponse<Student>>(url, { headers }).pipe(
      tap((response) => {
        console.log('📡 Respuesta paginada de estudiantes:', response);
        console.log('📊 Información de paginación de estudiantes:', response.pagination);
      }),
      catchError((error) => {
        console.error('❌ Error obteniendo estudiantes paginados:', error);
        return throwError(() => new Error('Error al cargar los estudiantes'));
      })
    );
  }

  /**
   * Agrega un nuevo estudiante a un curso
   * @param courseId ID del curso
   * @param student Datos del estudiante
   * @returns Observable con el estudiante creado
   */
  addStudentToCourse(courseId: string, student: Partial<Student>): Observable<Student> {
    const headers = this.authService.getAuthHeaders();
    
    const requestBody = {
      name: student.name,
      phoneNumber: student.phoneNumber,
      courseId: courseId
    };
    
    return this.http.post<Student>(`${this.apiUrl}/students`, requestBody, { headers }).pipe(
      catchError((error) => {
        console.error('Error agregando estudiante:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Elimina un estudiante
   * @param studentId ID del estudiante
   * @returns Observable vacío
   */
  removeStudentFromCourse(courseId: string, studentId: string): Observable<void> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.delete<void>(`${this.apiUrl}/students/${studentId}`, { headers }).pipe(
      catchError((error) => {
        console.error('Error eliminando estudiante:', error);
        return throwError(() => new Error('Error al eliminar el estudiante'));
      })
    );
  }

  /**
   * Actualiza los datos de un estudiante
   */
  updateStudent(studentId: string, data: { name?: string; phoneNumber?: string }): Observable<Student> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<Student>(`${this.apiUrl}/students/${studentId}`, data, { headers }).pipe(
      catchError((error) => {
        console.error('Error actualizando estudiante:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Importa estudiantes desde un archivo CSV
   * @param courseId ID del curso
   * @param csvFile Archivo CSV
   * @returns Observable con el resultado de la importación
   */
  importStudentsFromCSV(courseId: string, csvFile: File): Observable<ImportResult> {
    const headers = this.authService.getAuthHeaders();
    
    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', csvFile);
    
    console.log('📤 Enviando archivo CSV para importación:', {
      courseId,
      fileName: csvFile.name,
      fileSize: csvFile.size,
      fileType: csvFile.type
    });
    
    return this.http.post<ImportResult>(`${this.apiUrl}/students/course/${courseId}/import`, formData, { headers }).pipe(
      tap((response) => {
        console.log('📥 Respuesta de importación CSV:', response);
        console.log('📊 Estadísticas:', {
          exitosos: response.success,
          fallidos: response.failed,
          totalProcesados: response.success + response.failed,
          estudiantesCreados: response.createdStudents?.length || 0,
          errores: response.errors?.length || 0
        });
      }),
      catchError((error) => {
        console.error('❌ Error importando estudiantes desde CSV:', error);
        return throwError(() => new Error('Error al importar los estudiantes desde el archivo CSV'));
      })
    );
  }
}
