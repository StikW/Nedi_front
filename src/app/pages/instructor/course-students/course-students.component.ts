import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { Student, StudentCSV } from '../../../models/student.model';
import { PaginatedResponse } from '../../../models/paginated-response.model';
import { StudentsService } from '../../../core/services/students.service';
import { PhoneFormatPipe } from '../../../shared/pipes/phone-format.pipe';

@Component({
  selector: 'app-course-students',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, PhoneFormatPipe],
  templateUrl: './course-students.component.html',
  styleUrls: ['./course-students.component.scss']
})
export class CourseStudentsComponent implements OnInit {
  courseId: string = '';
  courseTitle: string = '';
  
  // Student management
  students: Student[] = [];
  isLoading = true;
  error: string | null = null;
  showAddStudentModal: boolean = false;
  showImportModal: boolean = false;
  isAddingStudent = false;
  isRemovingStudent = false;
  addStudentError: string | null = null;
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
  
  // Navigation history for cursor-based pagination
  studentCursorHistory: string[] = [];
  currentStudentPageIndex: number = 0;

  // Pipe instance for formatting phone numbers
  private phoneFormatPipe = new PhoneFormatPipe();

  constructor(
    private route: ActivatedRoute,
    private studentsService: StudentsService
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.params['id'] || '';
    this.loadCourseData();
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
    this.isLoading = true; // Sincronizar con el estado inicial
    this.error = null;

    this.studentsService.getStudentsPaginated(this.courseId, cursor, this.studentSortOrder).subscribe({
      next: (response: PaginatedResponse<Student>) => {
        this.students = response.data;
        this.nextStudentCursor = response.pagination.nextCursor;
        this.hasNextStudent = response.pagination.hasNext;
        this.currentStudentCursor = cursor;
        this.isLoadingStudents = false;
        this.isLoading = false; // Sincronizar con el estado inicial
        
        // Manejar historial de cursors
        this.updateStudentCursorHistory(cursor, isGoingBack);
        
        console.log('✅ Estudiantes cargados:', {
          count: response.data.length,
          hasNext: response.pagination.hasNext,
          nextCursor: response.pagination.nextCursor,
          limit: response.pagination.limit,
          sortOrder: response.pagination.sortOrder,
          currentPageIndex: this.currentStudentPageIndex,
          pageNumber: this.currentStudentPageIndex + 1,
          historyLength: this.studentCursorHistory.length,
          cursorHistory: this.studentCursorHistory,
          isGoingBack: isGoingBack
        });
      },
      error: (error) => {
        console.error('❌ Error loading students:', error);
        this.error = 'Error al cargar los estudiantes';
        this.isLoadingStudents = false;
        this.isLoading = false; // Sincronizar con el estado inicial
      }
    });
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

    this.isAddingStudent = true;
    this.addStudentError = null; // Limpiar errores previos

    const studentData = {
      name: this.newStudent.name,
      phoneNumber: this.phoneFormatPipe.transform(this.newStudent.phoneNumber)
    };

    this.studentsService.addStudentToCourse(this.courseId, studentData).subscribe({
      next: (newStudent) => {
        this.students = [...this.students, newStudent];
        this.closeAddStudentModal();
        this.isAddingStudent = false;
      },
      error: (error) => {
        console.error('Error agregando estudiante:', error);
        this.isAddingStudent = false;
        
        // Mostrar mensaje de error específico
        if (error.status === 400) {
          this.addStudentError = 'Los datos del estudiante no son válidos. Verifica el nombre y número de teléfono.';
        } else if (error.status === 409) {
          this.addStudentError = 'Este estudiante ya está registrado en el curso.';
        } else if (error.status === 500) {
          this.addStudentError = 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.';
        } else {
          this.addStudentError = 'No se pudo agregar el estudiante. Por favor, inténtalo de nuevo.';
        }
      }
    });
  }

  removeStudent(studentId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este estudiante?')) {
      this.isRemovingStudent = true;

      this.studentsService.removeStudentFromCourse(this.courseId, studentId).subscribe({
        next: () => {
          this.students = this.students.filter(student => student.id !== studentId);
          this.isRemovingStudent = false;
        },
        error: (error) => {
          console.error('Error eliminando estudiante:', error);
          this.isRemovingStudent = false;
          // Aquí podrías mostrar un mensaje de error al usuario
        }
      });
    }
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
      const invalidRows = this.csvPreview.filter(row => 
        !row.name || !row.phoneNumber
      );

      if (invalidRows.length > 0) {
        this.csvError = 'Some rows are missing required data';
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
          this.students = [...this.students, ...importResult.createdStudents];
        }
        
        // Mostrar resultado de la importación
        this.showImportResult(importResult);
        this.closeImportModal();
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
      this.loadStudents(this.nextStudentCursor, false);
    }
  }

  loadPreviousStudentPage(): void {
    if (!this.isLoadingStudents && this.canGoBackStudent()) {
      this.currentStudentPageIndex--;
      const previousCursor = this.studentCursorHistory[this.currentStudentPageIndex];
      this.loadStudents(previousCursor, true);
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
      this.loadStudents(); // Recargar con nuevo orden
    }
  }

} 