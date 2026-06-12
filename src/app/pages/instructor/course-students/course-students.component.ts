import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { Student, StudentCSV } from '../../../models/student.model';
import { PaginatedResponse } from '../../../models/paginated-response.model';
import { StudentsService } from '../../../core/services/students.service';
import { PhoneFormatPipe } from '../../../shared/pipes/phone-format.pipe';
import { validateStudentPhone } from '../../../shared/utils/phone-validation';
import { extractApiErrorMessage } from '../../../shared/utils/api-error';

@Component({
  selector: 'app-course-students',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, PhoneFormatPipe],
  templateUrl: './course-students.component.html',
  styleUrls: ['./course-students.component.scss']
})
export class CourseStudentsComponent implements OnInit, OnChanges {
  @Input() embedded = false;
  @Input() inputCourseId?: string;
  @Output() studentsChanged = new EventEmitter<void>();

  courseId: string = '';
  courseTitle: string = '';
  
  // Student management
  students: Student[] = [];
  isLoading = true;
  error: string | null = null;
  showAddStudentModal: boolean = false;
  showEditStudentModal: boolean = false;
  showDeleteStudentModal: boolean = false;
  showResetProgressModal: boolean = false;
  showImportModal: boolean = false;
  isAddingStudent = false;
  isUpdatingStudent = false;
  isRemovingStudent = false;
  isResettingProgress = false;
  addStudentError: string | null = null;
  editStudentError: string | null = null;
  removeStudentError: string | null = null;
  resetProgressError: string | null = null;
  editingStudent: Partial<Student> = {};
  studentToDelete: Student | null = null;
  studentToResetProgress: Student | null = null;
  newStudent: Partial<Student> = {
    name: '',
    phoneNumber: ''
  };
  csvFile: File | null = null;
  csvError: string | null = null;
  csvPreview: StudentCSV[] = [];

  // Student pagination
  currentStudentCursor?: string;
  nextStudentCursor?: string;
  hasNextStudent: boolean = false;
  isLoadingStudents: boolean = false;
  studentSortOrder: 'asc' | 'desc' = 'asc';

  // Student search
  searchQuery: string = '';
  isSearchingStudents = false;
  isSearchMode = false;
  currentSearchPattern = '';
  
  // Navigation history for cursor-based pagination
  studentCursorHistory: string[] = [];
  currentStudentPageIndex: number = 0;

  constructor(
    private route: ActivatedRoute,
    private studentsService: StudentsService
  ) {}

  ngOnInit(): void {
    if (this.embedded) {
      this.bootstrapEmbedded();
    } else {
      this.courseId = this.route.snapshot.params['id'] || '';
      this.loadCourseData();
      this.loadStudents();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.embedded && changes['inputCourseId'] && this.inputCourseId) {
      this.courseId = this.inputCourseId;
      this.loadStudents();
    }
  }

  private bootstrapEmbedded(): void {
    if (!this.inputCourseId) return;
    this.courseId = this.inputCourseId;
    this.isLoading = true;
    this.loadStudents();
  }

  private loadCourseData(): void {
    // TODO: Load course data from API
    this.courseTitle = 'Sample Course'; // This will be replaced with actual course title
  }

  loadStudents(cursor?: string, isGoingBack: boolean = false): void {
    if (!this.courseId) {
      this.error = 'ID de curso no válido';
      this.isLoading = false;
      this.isLoadingStudents = false;
      return;
    }

    this.isLoadingStudents = true;
    this.isLoading = true;
    this.error = null;

    const search = this.isSearchMode ? this.currentSearchPattern : undefined;

    this.studentsService
      .getStudentsPaginated(this.courseId, cursor, this.studentSortOrder, search)
      .subscribe({
        next: (response: PaginatedResponse<Student>) => {
          this.students = response.data;
          this.nextStudentCursor = response.pagination.nextCursor;
          this.hasNextStudent = response.pagination.hasNext;
          this.currentStudentCursor = cursor;
          this.isLoadingStudents = false;
          this.isLoading = false;
          this.isSearchingStudents = false;

          this.updateStudentCursorHistory(cursor, isGoingBack);
        },
        error: (error) => {
          console.error('❌ Error loading students:', error);
          this.error = 'Error al cargar los estudiantes';
          this.isLoadingStudents = false;
          this.isLoading = false;
          this.isSearchingStudents = false;
        },
      });
  }

  searchStudents(cursor?: string, isGoingBack: boolean = false): void {
    const term = this.searchQuery.trim();
    if (!term) {
      this.exitSearchMode();
      return;
    }

    this.isSearchingStudents = true;
    this.isSearchMode = true;
    this.currentSearchPattern = term;

    if (!cursor) {
      this.studentCursorHistory = [];
      this.currentStudentPageIndex = 0;
    }

    this.loadStudents(cursor, isGoingBack);
  }

  exitSearchMode(): void {
    this.isSearchMode = false;
    this.currentSearchPattern = '';
    this.searchQuery = '';
    this.isSearchingStudents = false;
    this.studentCursorHistory = [];
    this.currentStudentPageIndex = 0;
    this.loadStudents();
  }

  clearSearch(): void {
    this.exitSearchMode();
  }

  openAddStudentModal(): void {
    this.showAddStudentModal = true;
    this.addStudentError = null; // Limpiar errores previos
    this.newStudent = {
      name: '',
      phoneNumber: ''
    };
  }

  closeAddStudentModal(): void {
    this.showAddStudentModal = false;
    this.addStudentError = null; // Limpiar errores al cerrar
    this.newStudent = {
      name: '',
      phoneNumber: ''
    };
  }

  onPhoneNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // Solo formatear si el usuario no está escribiendo un número que ya empieza con +
    if (!value.startsWith('+')) {
      // Permitir que el usuario escriba libremente, solo formatear al final
      // Esto evita interferir mientras el usuario está escribiendo
    }
  }

  addStudent(): void {
    if (!this.newStudent.name || !this.newStudent.phoneNumber || !this.courseId) {
      return;
    }

    const phoneError = validateStudentPhone(this.newStudent.phoneNumber);
    if (phoneError) {
      this.addStudentError = phoneError;
      return;
    }

    this.isAddingStudent = true;
    this.addStudentError = null;

    const studentData = {
      name: this.newStudent.name.trim(),
      phoneNumber: this.newStudent.phoneNumber,
    };

    this.studentsService.addStudentToCourse(this.courseId, studentData).subscribe({
      next: () => {
        this.closeAddStudentModal();
        this.isAddingStudent = false;
        if (this.isSearchMode) {
          this.searchStudents();
        } else {
          this.loadStudents(this.currentStudentCursor);
        }
        this.studentsChanged.emit();
      },
      error: (error) => {
        console.error('Error agregando estudiante:', error);
        this.isAddingStudent = false;
        
        const apiMessage = extractApiErrorMessage(error);
        if (error.status === 409) {
          this.addStudentError =
            apiMessage ||
            'No se puede registrar: ya hay un estudiante con ese número en este curso. El teléfono no se puede repetir dentro del mismo curso.';
        } else if (error.status === 400) {
          this.addStudentError =
            apiMessage ||
            'Los datos del estudiante no son válidos. Verifica el nombre y número de teléfono.';
        } else if (error.status === 500) {
          this.addStudentError = 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.';
        } else {
          this.addStudentError =
            apiMessage || 'No se pudo agregar el estudiante. Por favor, inténtalo de nuevo.';
        }
      }
    });
  }

  openEditStudentModal(student: Student): void {
    const phoneNumber = student.phoneNumber.startsWith('+')
      ? student.phoneNumber
      : `+${student.phoneNumber}`;

    this.editingStudent = {
      id: student.id,
      name: student.name,
      phoneNumber,
    };
    this.editStudentError = null;
    this.showEditStudentModal = true;
  }

  closeEditStudentModal(): void {
    this.showEditStudentModal = false;
    this.editStudentError = null;
    this.editingStudent = {};
  }

  updateStudent(): void {
    if (!this.editingStudent.id || !this.editingStudent.name || !this.editingStudent.phoneNumber) {
      return;
    }

    const phoneError = validateStudentPhone(this.editingStudent.phoneNumber);
    if (phoneError) {
      this.editStudentError = phoneError;
      return;
    }

    this.isUpdatingStudent = true;
    this.editStudentError = null;

    const payload = {
      name: this.editingStudent.name.trim(),
      phoneNumber: this.editingStudent.phoneNumber,
    };

    this.studentsService.updateStudent(this.editingStudent.id, payload).subscribe({
      next: () => {
        this.closeEditStudentModal();
        this.isUpdatingStudent = false;
        if (this.isSearchMode) {
          this.searchStudents(this.currentStudentCursor);
        } else {
          this.loadStudents(this.currentStudentCursor);
        }
        this.studentsChanged.emit();
      },
      error: (error) => {
        console.error('Error actualizando estudiante:', error);
        this.isUpdatingStudent = false;
        const apiMessage = extractApiErrorMessage(error);
        if (error.status === 409) {
          this.editStudentError =
            apiMessage ||
            'No se puede actualizar: ya hay un estudiante con ese número en este curso. El teléfono no se puede repetir dentro del mismo curso.';
        } else if (error.status === 400) {
          this.editStudentError =
            apiMessage || 'Los datos no son válidos. Verifica el nombre y el teléfono.';
        } else {
          this.editStudentError =
            apiMessage || 'No se pudo actualizar el estudiante. Inténtalo de nuevo.';
        }
      },
    });
  }

  openDeleteStudentModal(student: Student): void {
    this.studentToDelete = student;
    this.removeStudentError = null;
    this.showDeleteStudentModal = true;
  }

  closeDeleteStudentModal(): void {
    if (this.isRemovingStudent) {
      return;
    }

    this.showDeleteStudentModal = false;
    this.studentToDelete = null;
    this.removeStudentError = null;
  }

  confirmRemoveStudent(): void {
    if (!this.studentToDelete || !this.courseId) {
      return;
    }

    const studentId = this.studentToDelete.id;
    this.isRemovingStudent = true;
    this.removeStudentError = null;

    this.studentsService.removeStudentFromCourse(this.courseId, studentId).subscribe({
      next: () => {
        this.students = this.students.filter((student) => student.id !== studentId);
        this.isRemovingStudent = false;
        this.closeDeleteStudentModal();
        this.studentsChanged.emit();
      },
      error: (error) => {
        console.error('Error eliminando estudiante:', error);
        this.isRemovingStudent = false;
        this.removeStudentError = 'No se pudo eliminar el estudiante. Inténtalo de nuevo.';
      },
    });
  }

  openResetProgressModal(student: Student): void {
    this.studentToResetProgress = student;
    this.resetProgressError = null;
    this.showResetProgressModal = true;
  }

  closeResetProgressModal(): void {
    if (this.isResettingProgress) {
      return;
    }

    this.showResetProgressModal = false;
    this.studentToResetProgress = null;
    this.resetProgressError = null;
  }

  confirmResetProgress(): void {
    if (!this.studentToResetProgress) {
      return;
    }

    const studentId = this.studentToResetProgress.id;
    this.isResettingProgress = true;
    this.resetProgressError = null;

    this.studentsService.resetStudentProgress(studentId).subscribe({
      next: () => {
        this.isResettingProgress = false;
        this.closeResetProgressModal();
        this.studentsChanged.emit();
      },
      error: (error) => {
        console.error('Error reiniciando progreso:', error);
        this.isResettingProgress = false;
        this.resetProgressError =
          extractApiErrorMessage(error) ||
          'No se pudo reiniciar el progreso. Inténtalo de nuevo.';
      },
    });
  }

  openImportModal(): void {
    this.showImportModal = true;
    this.csvFile = null;
    this.csvError = null;
    this.csvPreview = [];
  }

  closeImportModal(): void {
    this.showImportModal = false;
    this.csvFile = null;
    this.csvError = null;
    this.csvPreview = [];
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    if (file.type !== 'text/csv') {
      this.csvError = 'Please select a valid CSV file';
      this.csvFile = null;
      this.csvPreview = [];
      return;
    }

    this.csvFile = file;
    this.csvError = null;
    this.previewCSV(file);
  }

  private previewCSV(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

      // Validate headers
      const requiredHeaders = ['name', 'phonenumber'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        this.csvError = `Missing required columns: ${missingHeaders.join(', ')}`;
        this.csvPreview = [];
        return;
      }

      // Parse preview data
      this.csvPreview = lines
        .slice(1, 6) // Get first 5 rows
        .filter(line => line.trim()) // Skip empty lines
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          return {
            name: values[headers.indexOf('name')],
            documentNumber: '', // Empty since it's not used
            phoneNumber: values[headers.indexOf('phonenumber')]
          };
        });

      // Validate preview data
      const invalidRows = this.csvPreview.filter(
        (row) => !row.name || !row.phoneNumber || validateStudentPhone(row.phoneNumber) !== null,
      );

      if (invalidRows.length > 0) {
        this.csvError =
          'Algunas filas tienen datos inválidos. El teléfono debe comenzar con + y no contener espacios.';
        this.csvPreview = [];
      }
    };

    reader.onerror = () => {
      this.csvError = 'Error reading file';
      this.csvFile = null;
      this.csvPreview = [];
    };

    reader.readAsText(file);
  }

  importStudents(): void {
    if (!this.csvFile || this.csvError || !this.courseId) {
      return;
    }

    this.isAddingStudent = true; // Usar el estado de carga existente

    this.studentsService.importStudentsFromCSV(this.courseId, this.csvFile).subscribe({
      next: (importResult) => {
        this.isAddingStudent = false;
        
        // Agregar los estudiantes creados a la lista actual
        if (importResult.createdStudents && importResult.createdStudents.length > 0) {
          if (this.isSearchMode) {
            this.searchStudents();
          } else {
            this.loadStudents(this.currentStudentCursor);
          }
        }
        
        // Mostrar resultado de la importación
        this.showImportResult(importResult);
        this.closeImportModal();
        this.studentsChanged.emit();
      },
      error: (error) => {
        this.isAddingStudent = false;
        console.error('❌ Error importing students:', error);
        this.addStudentError = 'Error al importar los estudiantes desde el archivo CSV';
      }
    });
  }

  private showImportResult(result: any): void {
    const message = `Importación completada:\n` +
      `✅ Exitosos: ${result.success}\n` +
      `❌ Fallidos: ${result.failed}\n` +
      `📊 Total procesados: ${result.success + result.failed}`;
    
    if (result.errors && result.errors.length > 0) {
      console.warn('⚠️ Errores en la importación:', result.errors);
    }
    
    // Mostrar mensaje de éxito (puedes personalizar esto según tu UI)
    alert(message);
  }

  // Métodos de paginación para estudiantes
  loadNextStudentPage(): void {
    if (this.hasNextStudent && this.nextStudentCursor && !this.isLoadingStudents) {
      if (this.isSearchMode) {
        this.searchStudents(this.nextStudentCursor, false);
      } else {
        this.loadStudents(this.nextStudentCursor, false);
      }
    }
  }

  loadPreviousStudentPage(): void {
    if (!this.isLoadingStudents && this.canGoBackStudent()) {
      this.currentStudentPageIndex--;
      const previousCursor = this.studentCursorHistory[this.currentStudentPageIndex];
      if (this.isSearchMode) {
        this.searchStudents(previousCursor, true);
      } else {
        this.loadStudents(previousCursor, true);
      }
    }
  }

  // Métodos para manejar historial de cursors de estudiantes
  private updateStudentCursorHistory(cursor: string | undefined, isGoingBack: boolean): void {
    if (isGoingBack) {
      // Ya estamos navegando hacia atrás, no modificar el historial
      return;
    }

    if (cursor === undefined) {
      // Primera página - inicializar historial con página 1
      this.studentCursorHistory = [''];
      this.currentStudentPageIndex = 0;
    } else {
      // Si estamos navegando hacia adelante desde una posición anterior
      if (this.currentStudentPageIndex < this.studentCursorHistory.length - 1) {
        // Truncar el historial desde la posición actual
        this.studentCursorHistory = this.studentCursorHistory.slice(0, this.currentStudentPageIndex + 1);
      }
      
      // Agregar el nuevo cursor al historial
      this.studentCursorHistory.push(cursor);
      this.currentStudentPageIndex = this.studentCursorHistory.length - 1;
    }
  }

  canGoBackStudent(): boolean {
    return this.currentStudentPageIndex > 0;
  }

  changeStudentSortOrder(newOrder: 'asc' | 'desc'): void {
    if (this.studentSortOrder !== newOrder) {
      this.studentSortOrder = newOrder;
      if (this.isSearchMode) {
        this.searchStudents();
      } else {
        this.loadStudents();
      }
    }
  }

} 