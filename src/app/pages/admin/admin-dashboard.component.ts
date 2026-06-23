import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserModalComponent } from '../../components/user-modal/user-modal.component';
import { User } from '../../models/user.model';
import { PaginatedResponse } from '../../models/paginated-response.model';
import { UsersService } from '../../core/services/users.service';
import { DialogService } from '../../core/services/dialog.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, UserModalComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // Users
  users: User[] = [];

  // User pagination
  currentUserCursor?: string;
  nextUserCursor?: string;
  hasNextUser: boolean = false;
  isLoadingUsers: boolean = false;
  userSortOrder: 'asc' | 'desc' = 'asc';
  
  // Navigation history for cursor-based pagination
  userCursorHistory: string[] = [];
  currentUserPageIndex: number = 0;

  // UI state
  isLoading: boolean = true;
  showUserModal: boolean = false;
  isSubmittingUser: boolean = false;
  selectedUser: User | null = null;
  
  // Search functionality
  searchEmail: string = '';
  isSearching: boolean = false;
  isSearchMode: boolean = false;
  currentSearchPattern: string = '';

  private usersSubscription?: Subscription;

  constructor(
    private usersService: UsersService,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.usersSubscription?.unsubscribe();
  }

  private loadUsers(cursor?: string, isGoingBack: boolean = false): void {
    this.isLoadingUsers = true;
    this.isLoading = true; // Sincronizar con el estado inicial

    this.usersService.getUsersPaginated(cursor, this.userSortOrder).subscribe({
      next: (response: PaginatedResponse<User>) => {
        this.users = response.data ?? [];
        this.nextUserCursor = response.pagination.nextCursor;
        this.hasNextUser = response.pagination.hasNext;
        this.currentUserCursor = cursor;
        this.isLoadingUsers = false;
        this.isLoading = false; // Sincronizar con el estado inicial
        
        // Manejar historial de cursors
        this.updateUserCursorHistory(cursor, isGoingBack);
        
        console.log('✅ Usuarios cargados:', {
          count: response.data.length,
          hasNext: response.pagination.hasNext,
          nextCursor: response.pagination.nextCursor,
          limit: response.pagination.limit,
          sortOrder: response.pagination.sortOrder,
          currentPageIndex: this.currentUserPageIndex,
          pageNumber: this.currentUserPageIndex + 1,
          historyLength: this.userCursorHistory.length,
          cursorHistory: this.userCursorHistory,
          isGoingBack: isGoingBack
        });
      },
      error: (error) => {
        console.error('❌ Error loading users:', error);
        this.isLoadingUsers = false;
        this.isLoading = false; // Sincronizar con el estado inicial
        // TODO: Show error message to user
      }
    });
  }



  deleteUser(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    const userName = user?.name || 'este usuario';
    const extra =
      user?.role === 'instructor'
        ? '\n\nTambién se eliminarán sus cursos, datos del agente e instancia de WhatsApp (Evolution).'
        : '';

    this.dialogService.confirm({
      title: 'Eliminar usuario',
      message: `¿Estás seguro de que quieres eliminar a "${userName}"? Esta acción no se puede deshacer.${extra}`,
      confirmText: 'Eliminar',
      variant: 'danger',
    }).then(confirmed => {
      if (!confirmed) return;

      this.usersService.deleteUser(userId).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== userId);
        },
        error: (error) => {
          console.error('Error eliminando usuario:', error);
          this.dialogService.alert({
            title: 'Error',
            message: 'No se pudo eliminar el usuario. Por favor, inténtalo de nuevo.',
            variant: 'danger',
          });
        },
      });
    });
  }

  refreshUsers(): void {
    if (this.isLoadingUsers) return;

    this.isSearchMode = false;
    this.searchEmail = '';
    this.currentSearchPattern = '';
    this.userCursorHistory = [''];
    this.currentUserPageIndex = 0;
    this.currentUserCursor = undefined;
    this.loadUsers();
  }

  /** Vuelve a la primera página y recarga la lista visible en el panel. */
  private reloadUserList(): void {
    this.userCursorHistory = [''];
    this.currentUserPageIndex = 0;
    this.currentUserCursor = undefined;

    if (this.isSearchMode) {
      this.searchUsersByEmail();
      return;
    }

    this.loadUsers();
  }

  getRoleLabel(role: string): string {
    const roleLabels: Record<string, string> = {
      'admin': 'Administrador',
      'instructor': 'Instructor',
      'student': 'Estudiante',
    };
    return roleLabels[role] || role;
  }

  getRoleColor(role: string): string {
    const roleColors: Record<string, string> = {
      'admin': 'bg-red-100 text-red-800',
      'instructor': 'bg-blue-100 text-blue-800',
      'student': 'bg-green-100 text-green-800',
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  }

  openAddUserModal(): void {
    this.selectedUser = null;
    this.showUserModal = true;
  }

  openEditUserModal(user: User): void {
    this.selectedUser = user;
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.selectedUser = null;
    this.isSubmittingUser = false;
  }

  handleUserSubmit(userData: Partial<User>): void {
    this.isSubmittingUser = true;
    
    if (this.selectedUser) {
      // Edit existing user
      this.usersService.updateUser(this.selectedUser.id, userData).subscribe({
        next: (updatedUser) => {
          if (updatedUser) {
            this.users = this.users.map(u =>
              u.id === updatedUser.id ? updatedUser : u,
            );
          }
          this.isSubmittingUser = false;
          this.closeUserModal();
        },
        error: (error) => {
          console.error('Error actualizando usuario:', error);
          this.isSubmittingUser = false;
          this.dialogService.alert({
            title: 'Error',
            message: 'No se pudo actualizar el usuario. Por favor, inténtalo de nuevo.',
            variant: 'danger',
          });
        }
      });
    } else {
      // Create new user
      this.usersService.createUser(userData as Omit<User, 'id' | 'createdAt' | 'lastLogin'>).subscribe({
        next: () => {
          this.isSubmittingUser = false;
          this.closeUserModal();
          this.isSearchMode = false;
          this.searchEmail = '';
          this.currentSearchPattern = '';
          this.reloadUserList();
        },
        error: (error) => {
          console.error('Error creando usuario:', error);
          this.isSubmittingUser = false;
          this.dialogService.alert({
            title: 'Error',
            message: 'No se pudo crear el usuario. Por favor, inténtalo de nuevo.',
            variant: 'danger',
          });
        }
      });
    }
  }

  get modalMode(): 'create' | 'edit' {
    return this.selectedUser ? 'edit' : 'create';
  }

  // Métodos de paginación para usuarios
  loadNextUserPage(): void {
    if (this.hasNextUser && this.nextUserCursor && !this.isLoadingUsers) {
      if (this.isSearchMode) {
        this.searchUsersByEmail(this.nextUserCursor, false);
      } else {
        this.loadUsers(this.nextUserCursor, false);
      }
    }
  }

  loadPreviousUserPage(): void {
    if (!this.isLoadingUsers && this.canGoBackUser()) {
      this.currentUserPageIndex--;
      const previousCursor = this.userCursorHistory[this.currentUserPageIndex];
      if (this.isSearchMode) {
        this.searchUsersByEmail(previousCursor, true);
      } else {
        this.loadUsers(previousCursor, true);
      }
    }
  }

  // Métodos para manejar historial de cursors de usuarios
  private updateUserCursorHistory(cursor: string | undefined, isGoingBack: boolean): void {
    if (isGoingBack) {
      // Ya estamos navegando hacia atrás, no modificar el historial
      return;
    }

    if (cursor === undefined) {
      // Primera página - inicializar historial con página 1
      this.userCursorHistory = [''];
      this.currentUserPageIndex = 0;
    } else {
      // Si estamos navegando hacia adelante desde una posición anterior
      if (this.currentUserPageIndex < this.userCursorHistory.length - 1) {
        // Truncar el historial desde la posición actual
        this.userCursorHistory = this.userCursorHistory.slice(0, this.currentUserPageIndex + 1);
      }
      
      // Agregar el nuevo cursor al historial
      this.userCursorHistory.push(cursor);
      this.currentUserPageIndex = this.userCursorHistory.length - 1;
    }
  }

  canGoBackUser(): boolean {
    return this.currentUserPageIndex > 0;
  }

  changeUserSortOrder(newOrder: 'asc' | 'desc'): void {
    if (this.userSortOrder !== newOrder) {
      this.userSortOrder = newOrder;
      if (this.isSearchMode) {
        this.searchUsersByEmail(); // Recargar búsqueda con nuevo orden
      } else {
        this.loadUsers(); // Recargar usuarios normales con nuevo orden
      }
    }
  }

  // Método de búsqueda por correo usando endpoint
  searchUsersByEmail(cursor?: string, isGoingBack: boolean = false): void {
    if (!this.searchEmail.trim()) {
      // Si no hay término de búsqueda, cargar usuarios normales
      this.exitSearchMode();
      return;
    }

    this.isSearching = true;
    this.isLoadingUsers = true;
    this.isLoading = true;
    this.isSearchMode = true;
    this.currentSearchPattern = this.searchEmail.trim();

    this.usersService.searchUsersPaginated(this.currentSearchPattern, cursor, this.userSortOrder).subscribe({
      next: (response: PaginatedResponse<User>) => {
        this.users = response.data ?? [];
        this.nextUserCursor = response.pagination.nextCursor;
        this.hasNextUser = response.pagination.hasNext;
        this.currentUserCursor = cursor;
        this.isSearching = false;
        this.isLoadingUsers = false;
        this.isLoading = false;
        
        // Manejar historial de cursors
        this.updateUserCursorHistory(cursor, isGoingBack);
        
        console.log('🔍 Búsqueda completada:', {
          searchPattern: this.currentSearchPattern,
          count: response.data.length,
          hasNext: response.pagination.hasNext,
          nextCursor: response.pagination.nextCursor,
          limit: response.pagination.limit,
          sortOrder: response.pagination.sortOrder,
          currentPageIndex: this.currentUserPageIndex,
          pageNumber: this.currentUserPageIndex + 1,
          historyLength: this.userCursorHistory.length,
          cursorHistory: this.userCursorHistory,
          isGoingBack: isGoingBack,
          results: response.data.map(u => ({ id: u.id, email: u.email, name: u.name }))
        });
      },
      error: (error) => {
        console.error('❌ Error en búsqueda:', error);
        this.isSearching = false;
        this.isLoadingUsers = false;
        this.isLoading = false;
      }
    });
  }

  // Salir del modo de búsqueda y volver a usuarios normales
  exitSearchMode(): void {
    this.isSearchMode = false;
    this.currentSearchPattern = '';
    this.searchEmail = '';
    this.loadUsers(); // Recargar usuarios normales con paginación
  }

}
