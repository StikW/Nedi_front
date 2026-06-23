import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { User } from '../../models/user.model';
import { environment } from '../../../environments/environment';
import { isSupportedRole } from '../utils/role-routes';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'currentUser';
  private readonly apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    // Check if user is already logged in from localStorage
    const storedUser = localStorage.getItem(this.STORAGE_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        if (!isSupportedRole(user?.role)) {
          // Rol legacy (p.ej. meta) ya no tiene panel; evita bucles de redirección.
          localStorage.removeItem(this.STORAGE_KEY);
          this.currentUserSubject.next(null);
        } else {
          this.currentUserSubject.next(user);
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem(this.STORAGE_KEY);
        this.currentUserSubject.next(null);
      }
    } else {
      // Initialize with no user logged in
      this.currentUserSubject.next(null);
    }
  }

  /**
   * Attempt to log in a user
   * @param email - User's email
   * @param password - User's password
   * @returns Observable of the logged in user
   */
  login(email: string, password: string): Observable<User> {
    const loginData = { email, password };
    
    return this.http.post<User>(`${this.apiUrl}/auth/login`, loginData).pipe(
      tap(user => {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        console.log('User logged in:', user);
        this.currentUserSubject.next(user);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Login error:', error);
        let errorMessage = 'Error al iniciar sesión';
        
        if (error.status === 401) {
          errorMessage = 'Credenciales inválidas';
        } else if (error.status === 404) {
          errorMessage = 'Usuario no encontrado';
        } else if (error.status >= 500) {
          errorMessage = 'Error del servidor. Intenta más tarde';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Register a new user
   * @param userData - User registration data
   * @param useAuth - Whether to include authentication headers (for admin registration)
   * @returns Observable of the registered user
   */
  register(userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>, useAuth: boolean = false): Observable<User> {
    const options = useAuth ? { headers: this.getAuthHeaders() } : {};
    
    return this.http.post<User>(`${this.apiUrl}/auth/register`, userData, options).pipe(
      tap(user => {
        console.log('User registered:', user);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Registration error:', error);
        let errorMessage = 'Error al registrar el usuario';
        
        if (error.status === 400) {
          errorMessage = 'Datos inválidos o usuario ya existe';
        } else if (error.status === 409) {
          errorMessage = 'El usuario ya existe';
        } else if (error.status === 401) {
          errorMessage = 'No autorizado para registrar usuarios';
        } else if (error.status >= 500) {
          errorMessage = 'Error del servidor. Intenta más tarde';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Log out the current user
   */
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUserSubject.next(null);
    void this.router.navigate(['/login']);
  }

  /**
   * Check if user is currently logged in
   */
  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  /**
   * Get the current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get the authentication token
   */
  getAuthToken(): string | null {
    const user = this.getCurrentUser();
    return user?.token || null;
  }

  /**
   * Get HTTP headers with authentication
   */
  getAuthHeaders(): { [key: string]: string } {
    const token = this.getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Recupera el perfil actualizado del usuario autenticado desde el backend.
   * \u00datil para refrescar campos como `phoneNumber` que pueden no venir en el
   * token JWT que tenemos guardado en localStorage.
   */
  getMyProfile(): Observable<User> {
    return this.http
      .get<User>(`${this.apiUrl}/auth/me`, { headers: this.getAuthHeaders() })
      .pipe(
        tap((user) => this.persistCurrentUser({ ...this.getCurrentUser(), ...user } as User)),
        catchError((error: HttpErrorResponse) => {
          console.error('Error obteniendo perfil:', error);
          return throwError(() => new Error('Error al obtener el perfil'));
        }),
      );
  }

  /**
   * Actualiza el perfil del usuario autenticado.
   * Solo se permiten los campos: name, email, phoneNumber.
   * Tras la respuesta sincronizamos localStorage y `currentUser$`.
   */
  updateMyProfile(payload: { name?: string; email?: string; phoneNumber?: string }): Observable<User> {
    return this.http
      .put<User>(`${this.apiUrl}/auth/me`, payload, { headers: this.getAuthHeaders() })
      .pipe(
        tap((user) => this.persistCurrentUser({ ...this.getCurrentUser(), ...user } as User)),
        catchError((error: HttpErrorResponse) => {
          console.error('Error actualizando perfil:', error);
          let errorMessage = 'Error al actualizar el perfil';
          if (error.status === 400) {
            errorMessage = 'Datos inv\u00e1lidos. Revisa el formato del tel\u00e9fono.';
          } else if (error.status === 409) {
            errorMessage = 'Ese correo ya est\u00e1 en uso por otro usuario';
          } else if (error.status >= 500) {
            errorMessage = 'Error del servidor. Intenta m\u00e1s tarde';
          }
          return throwError(() => new Error(errorMessage));
        }),
      );
  }

  /**
   * Sincroniza el usuario actual en memoria + localStorage manteniendo el token.
   */
  private persistCurrentUser(user: User): void {
    if (!user) return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Change user password
   * @param currentPassword - Current password
   * @param newPassword - New password
   * @returns Observable of success response
   */
  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    const passwordData = { currentPassword, newPassword };
    
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/change-password`, passwordData, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('Password changed successfully:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Change password error:', error);
        let errorMessage = 'Error al cambiar la contraseña';
        
        if (error.status === 400) {
          errorMessage = 'Datos inválidos';
        } else if (error.status === 401) {
          errorMessage = 'Contraseña actual incorrecta';
        } else if (error.status === 403) {
          errorMessage = 'No autorizado para cambiar la contraseña';
        } else if (error.status >= 500) {
          errorMessage = 'Error del servidor. Intenta más tarde';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }
} 