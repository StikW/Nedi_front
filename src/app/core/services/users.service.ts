import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap, map } from 'rxjs/operators';
import { User } from '../../models/user.model';
import { PaginatedResponse } from '../../models/paginated-response.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly apiUrl = environment.apiUrl;
  private users: User[] = [];
  private usersSubject = new BehaviorSubject<User[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Cargar usuarios al inicializar el servicio
    this.loadUsers();
  }

  /**
   * Cargar usuarios desde el backend
   */
  private loadUsers(): void {
    this.http.get<{users: User[]}>(`${this.apiUrl}/users`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        if (response.users && response.users.length > 0) {
          this.users = response.users;
          this.usersSubject.next(response.users);
        } 
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error cargando usuarios:', error);
        this.loadMockUsers();
        return throwError(() => new Error('Error al cargar los usuarios'));
      })
    ).subscribe();
  }

  /**
   * Cargar datos mock como fallback
   */
  private loadMockUsers(): void {
    this.users = [
      {
        id: 1,
        email: 'admin@example.com',
        name: 'Administrador Principal',
        role: 'admin',
        createdAt: new Date('2024-01-01'),
        lastLogin: new Date()
      },
      {
        id: 2,
        email: 'instructor1@example.com',
        name: 'María García',
        role: 'instructor',
        clientIdApp: 'client_123456',
        clientSecretApp: 'secret_abcdef',
        businessAccountId: 'business_789',
        accessToken: 'token_xyz123',
        createdAt: new Date('2024-01-15'),
        lastLogin: new Date('2024-01-20')
      },
      {
        id: 3,
        email: 'instructor2@example.com',
        name: 'Carlos Rodríguez',
        role: 'instructor',
        clientIdApp: 'client_789012',
        clientSecretApp: 'secret_ghijkl',
        businessAccountId: 'business_456',
        accessToken: 'token_abc456',
        createdAt: new Date('2024-01-20'),
        lastLogin: new Date('2024-01-22')
      },
      {
        id: 4,
        email: 'student1@example.com',
        name: 'Ana López',
        role: 'student',
        createdAt: new Date('2024-02-01'),
        lastLogin: new Date('2024-02-15')
      },
      {
        id: 5,
        email: 'student2@example.com',
        name: 'Pedro Martínez',
        role: 'student',
        createdAt: new Date('2024-02-05'),
        lastLogin: new Date('2024-02-18')
      }
    ];
    this.usersSubject.next(this.users);
  }

  /**
   * Obtener todos los usuarios
   */
  getUsers(): Observable<User[]> {
    return this.usersSubject.asObservable();
  }

  /**
   * Obtener usuarios con paginación
   * @param cursor Cursor para la siguiente página
   * @param sortOrder Orden: 'asc' o 'desc'
   * @returns Observable con respuesta paginada
   */
  getUsersPaginated(cursor?: string, sortOrder: 'asc' | 'desc' = 'asc'): Observable<PaginatedResponse<User>> {
    const headers = this.authService.getAuthHeaders();
    let url = `${this.apiUrl}/users?sortOrder=${sortOrder}`;
    
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    
    console.log('🌐 Llamando al endpoint de usuarios paginados:', url);
    
    return this.http.get<PaginatedResponse<User>>(url, { headers }).pipe(
      tap((response) => {
        console.log('📡 Respuesta paginada de usuarios:', response);
        console.log('📊 Información de paginación de usuarios:', response.pagination);
        // Actualizar la lista local con los nuevos datos
        if (response.data && response.data.length > 0) {
          this.users = response.data;
          this.usersSubject.next(response.data);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error obteniendo usuarios paginados:', error);
        return throwError(() => new Error('Error al cargar los usuarios'));
      })
    );
  }

  /**
   * Buscar usuarios por patrón con paginación
   * @param searchPattern Patrón de búsqueda
   * @param cursor Cursor para la siguiente página
   * @param sortOrder Orden: 'asc' o 'desc'
   * @returns Observable con respuesta paginada
   */
  searchUsersPaginated(searchPattern: string, cursor?: string, sortOrder: 'asc' | 'desc' = 'asc'): Observable<PaginatedResponse<User>> {
    const headers = this.authService.getAuthHeaders();
    const encodedPattern = encodeURIComponent(searchPattern);
    let url = `${this.apiUrl}/users/search/${encodedPattern}?sortOrder=${sortOrder}`;
    
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    
    console.log('🔍 Llamando al endpoint de búsqueda de usuarios:', url);
    
    return this.http.get<PaginatedResponse<User>>(url, { headers }).pipe(
      tap((response) => {
        console.log('📡 Respuesta paginada de búsqueda:', response);
        console.log('📊 Información de paginación de búsqueda:', response.pagination);
        console.log('🔍 Patrón de búsqueda:', searchPattern);
        // Actualizar la lista local con los nuevos datos
        if (response.data && response.data.length > 0) {
          this.users = response.data;
          this.usersSubject.next(response.data);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error en búsqueda de usuarios:', error);
        return throwError(() => new Error('Error al buscar usuarios'));
      })
    );
  }

  /**
   * Recargar usuarios desde el backend
   */
  refreshUsers(): Observable<User[]> {
    return this.http.get<{users: User[]}>(`${this.apiUrl}/users`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        if (response.users && response.users.length > 0) {
          this.users = response.users;
          this.usersSubject.next(response.users);
        } 
      }),
      map(response => response.users),
      catchError((error: HttpErrorResponse) => {
        console.error('Error recargando usuarios:', error);
        return throwError(() => new Error('Error al recargar los usuarios'));
      })
    );
  }

  /**
   * Crear un nuevo usuario instructor usando el endpoint de register
   */
  createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Observable<User> {
    // Validar que solo se puedan crear instructores
    if (userData.role !== 'instructor') {
      return throwError(() => new Error('Solo se pueden crear usuarios de tipo instructor'));
    }

    // Usar el endpoint de register del auth service con autenticación
    return this.authService.register(userData, true).pipe(
      tap(newUser => {
        this.users = [...this.users, newUser];
        this.usersSubject.next(this.users);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error creando usuario instructor:', error);
        return throwError(() => new Error('Error al crear el instructor'));
      })
    );
  }

  /**
   * Actualizar un usuario existente
   */
  updateUser(id: number, userData: Partial<User>): Observable<User | null> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, userData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(updatedUser => {
        const index = this.users.findIndex(user => user.id === id);
        if (index !== -1) {
          this.users[index] = updatedUser;
          this.usersSubject.next(this.users);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error actualizando usuario:', error);
        return throwError(() => new Error('Error al actualizar el usuario'));
      })
    );
  }

  /**
   * Eliminar un usuario
   */
  deleteUser(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/users/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        this.users = this.users.filter(user => user.id !== id);
        this.usersSubject.next(this.users);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error eliminando usuario:', error);
        return throwError(() => new Error('Error al eliminar el usuario'));
      })
    );
  }

  /**
   * Obtener un usuario por ID
   */
  getUserById(id: number): Observable<User | null> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error obteniendo usuario:', error);
        
        if (error.status === 404) {
          const user = this.users.find(user => user.id === id);
          return of(user || null);
        }
        
        return throwError(() => new Error('Error al obtener el usuario'));
      })
    );
  }

  /**
   * Obtener estadísticas de usuarios
   */
  getUserStats(): Observable<{total: number, admins: number, instructors: number, students: number}> {
    const stats = {
      total: this.users.length,
      admins: this.users.filter(u => u.role === 'admin').length,
      instructors: this.users.filter(u => u.role === 'instructor').length,
      students: this.users.filter(u => u.role === 'student').length
    };
    return of(stats);
  }
}
