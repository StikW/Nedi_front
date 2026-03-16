import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { CoursesService } from '../courses.service';
import { UploadsService, UploadProgress } from '../../../core/services/uploads.service';
import { InstructorCourse, CourseStatus } from '../../../models/course.model';

@Component({
  selector: 'app-course-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './course-editor.component.html',
  styleUrls: ['./course-editor.component.css']
})
export class CourseEditorComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  courseForm: FormGroup;
  isEditing = false;
  isSubmitting = false;
  courseId: string | null = null;
  
  // Image upload properties
  selectedImage: string | null = null;
  selectedImageFile: File | null = null;
  selectedImageName: string = '';
  selectedImageSize: string = '';
  isUploading = false;
  uploadProgress = 0;

  categories = [
    { value: 'programming', label: 'Programación' },
    { value: 'design', label: 'Diseño' },
    { value: 'business', label: 'Negocios' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'music', label: 'Música' },
    { value: 'photography', label: 'Fotografía' },
    { value: 'language', label: 'Idiomas' },
    { value: 'other', label: 'Otros' }
  ];



  constructor(
    private fb: FormBuilder, 
    private coursesService: CoursesService,
    private uploadsService: UploadsService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.courseForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
      category: ['', Validators.required],
      imageUrl: [''],
      objectives: ['', [Validators.required, Validators.minLength(20)]],
      prerequisites: ['', Validators.minLength(10)]
    });
  }

  ngOnInit() {
    // Get course ID from route if editing
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.courseId = params['id'];
        this.isEditing = true;
        this.loadCourseData();
      }
    });
  }

  private loadCourseData() {
    if (this.isEditing && this.courseId) {
      this.coursesService.getCourseById(this.courseId).subscribe(course => {
        if (course) {
          this.courseForm.patchValue(course);
          
          // Si el curso tiene una imagen existente, configurar las propiedades de vista previa
          if (course.imageUrl) {
            this.selectedImage = course.imageUrl;
            this.selectedImageName = this.extractFileNameFromUrl(course.imageUrl);
            this.selectedImageSize = 'Imagen existente';
            // No establecer selectedImageFile porque no tenemos el archivo original
          }
        }
      });
    }
  }

  private extractFileNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || 'imagen.jpg';
      return decodeURIComponent(fileName);
    } catch {
      return 'imagen.jpg';
    }
  }

  onSubmit() {
    console.log('🚀 onSubmit - Iniciando envío del formulario');
    
    if (this.isFormValid()) {
      console.log('✅ Formulario válido, procediendo...');
      this.isSubmitting = true;
      
      console.log('📝 onSubmit - Estado actual:', {
        isEditing: this.isEditing,
        courseId: this.courseId,
        selectedImageFile: this.selectedImageFile ? this.selectedImageFile.name : 'null',
        hasExistingImage: !!this.courseForm.get('imageUrl')?.value,
        formValid: this.courseForm.valid,
        formValues: this.courseForm.value
      });
      
      // Si hay una imagen seleccionada, procesar según el modo
      if (this.selectedImageFile) {
        console.log('🖼️ Imagen seleccionada, procesando...');
        
        if (!this.isEditing) {
          // Crear curso nuevo: primero crear con imagen provisional, luego subir imagen real
          console.log('🆕 Creando curso nuevo con imagen provisional...');
          this.createCourseWithProvisionalImage();
        } else {
          // Editar curso existente: subir imagen directamente
          console.log('✏️ Editando curso existente, subiendo imagen...');
          this.uploadImage().then(imageUrl => {
            console.log('✅ Imagen subida exitosamente, URL:', imageUrl);
            this.submitCourseData(imageUrl);
          }).catch(error => {
            console.error('❌ Error uploading image:', error);
            this.isSubmitting = false;
          });
        }
      } else {
        // Si no hay imagen nueva, usar la URL existente
        console.log('🖼️ Sin imagen nueva, usando URL existente');
        this.submitCourseData(this.courseForm.value.imageUrl);
      }
    } else {
      console.log('❌ Formulario inválido:', {
        formValid: this.courseForm.valid,
        formErrors: this.courseForm.errors,
        hasImage: this.selectedImage || this.courseForm.get('imageUrl')?.value
      });
    }
  }





  private createCourseWithProvisionalImage() {
    console.log('🏗️ createCourseWithProvisionalImage - Creando curso con imagen provisional...');
    
    // Crear el curso con una imagen provisional
    const courseDataWithProvisionalImage = {
      ...this.courseForm.value,
      imageUrl: 'https://via.placeholder.com/400x300?text=Imagen+Provisional', // URL provisional
      status: 'draft' as CourseStatus
    };

    console.log('📤 Enviando datos del curso con imagen provisional:', courseDataWithProvisionalImage);

    this.coursesService.createCourse(courseDataWithProvisionalImage).subscribe({
      next: (newCourse) => {
        console.log('✅ Curso creado con imagen provisional:', newCourse);
        
        // Ahora que tenemos el courseId, subir la imagen real
        if (newCourse.id) {
          console.log('🆔 CourseId obtenido:', newCourse.id);
          this.courseId = newCourse.id;
          console.log('📤 Subiendo imagen real...');
          this.uploadImage().then(imageUrl => {
            console.log('✅ Imagen real subida exitosamente, URL:', imageUrl);
            // Actualizar el curso con la URL de la imagen real
            this.updateCourseWithRealImage(imageUrl);
          }).catch(error => {
            console.error('❌ Error uploading real image:', error);
            this.isSubmitting = false;
            // El curso ya existe con imagen provisional, podríamos mostrar un mensaje de error
          });
        } else {
          console.error('❌ Curso creado pero sin ID');
          this.isSubmitting = false;
        }
      },
      error: (error) => {
        console.error('❌ Error creating course:', error);
        this.isSubmitting = false;
      }
    });
  }

  private updateCourseWithRealImage(imageUrl: string) {
    console.log('🔄 updateCourseWithRealImage - Actualizando curso con imagen real...');
    
    if (!this.courseId) {
      console.error('❌ No course ID available for update');
      this.isSubmitting = false;
      return;
    }

    const courseDataWithRealImage = {
      ...this.courseForm.value,
      imageUrl: imageUrl,
      status: 'draft' as CourseStatus
    };

    console.log('📤 Actualizando curso con imagen real:', courseDataWithRealImage);

    this.coursesService.updateCourse(this.courseId, courseDataWithRealImage).subscribe({
      next: (updatedCourse) => {
        console.log('✅ Curso actualizado con imagen real:', updatedCourse);
        this.isSubmitting = false;
        this.router.navigate(['/instructor']);
      },
      error: (error) => {
        console.error('❌ Error updating course with real image:', error);
        this.isSubmitting = false;
      }
    });
  }

  private submitCourseData(imageUrl: string) {
    const courseData = {
      ...this.courseForm.value,
      imageUrl: imageUrl,
      status: 'draft' as CourseStatus
    };

    if (this.isEditing && this.courseId) {
      this.coursesService.updateCourse(this.courseId, courseData).subscribe({
        next: (updatedCourse) => {
          console.log('Course updated:', updatedCourse);
          this.isSubmitting = false;
          if (this.courseId) {
            this.router.navigate(['/instructor/courses', this.courseId]);
          }
        },
        error: (error) => {
          console.error('Error updating course:', error);
          this.isSubmitting = false;
        }
      });
    } else {
      this.coursesService.createCourse(courseData).subscribe({
        next: (newCourse) => {
          console.log('Course created:', newCourse);
          this.isSubmitting = false;
          this.router.navigate(['/instructor']);
        },
        error: (error) => {
          console.error('Error creating course:', error);
          this.isSubmitting = false;
        }
      });
    }
  }

  // Image upload methods
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleImageFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
    
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleImageFile(event.dataTransfer.files[0]);
    }
  }

  private handleImageFile(file: File) {
    console.log('🖼️ handleImageFile llamado con:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('La imagen debe ser menor a 5MB.');
      return;
    }

    // Crear URL para vista previa
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      // Actualizar todas las propiedades de imagen
      this.selectedImage = dataUrl;
      this.selectedImageFile = file;
      this.selectedImageName = file.name;
      this.selectedImageSize = this.formatFileSize(file.size);
      
      // Limpiar la URL del formulario ya que ahora tenemos un archivo
      this.courseForm.patchValue({ imageUrl: '' });
      
      console.log('✅ Propiedades de imagen actualizadas:', {
        selectedImage: this.selectedImage ? 'Data URL generada' : 'null',
        selectedImageFile: this.selectedImageFile ? this.selectedImageFile.name : 'null',
        selectedImageName: this.selectedImageName,
        selectedImageSize: this.selectedImageSize,
        isUploading: this.isUploading,
        uploadProgress: this.uploadProgress
      });
    };
    
    reader.onerror = (error) => {
      console.error('❌ Error leyendo archivo:', error);
      alert('Error al procesar la imagen. Por favor intenta de nuevo.');
    };
    
    reader.readAsDataURL(file);
  }

  removeImage() {
    console.log('🗑️ removeImage llamado');
    
    // Limpiar todas las propiedades de imagen
    this.selectedImage = null;
    this.selectedImageFile = null;
    this.selectedImageName = '';
    this.selectedImageSize = '';
    
    // Restaurar URL original si estamos editando
    if (this.isEditing) {
      const originalImageUrl = this.courseForm.get('imageUrl')?.value || '';
      this.courseForm.patchValue({ imageUrl: originalImageUrl });
      
      // Si había una URL original, restaurar la vista previa
      if (originalImageUrl) {
        this.selectedImage = originalImageUrl;
        this.selectedImageName = this.extractFileNameFromUrl(originalImageUrl);
        this.selectedImageSize = 'Imagen existente';
      }
    }
    
    console.log('✅ Propiedades de imagen limpiadas:', {
      selectedImage: this.selectedImage,
      selectedImageFile: this.selectedImageFile,
      selectedImageName: this.selectedImageName,
      selectedImageSize: this.selectedImageSize
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private uploadImage(): Promise<string> {
    console.log('📤 uploadImage llamado con:', {
      selectedImageFile: this.selectedImageFile ? this.selectedImageFile.name : 'null',
      courseId: this.courseId,
      isUploading: this.isUploading,
      uploadProgress: this.uploadProgress
    });

    if (!this.selectedImageFile) {
      const error = 'No image file selected';
      console.error('❌', error);
      return Promise.reject(new Error(error));
    }

    if (!this.courseId) {
      const error = 'No course ID available for upload';
      console.error('❌', error);
      return Promise.reject(new Error(error));
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    console.log('🚀 Iniciando subida de imagen para curso:', this.courseId);

    return new Promise((resolve, reject) => {
      // Usar el servicio de uploads para subir la imagen
      this.uploadsService.uploadFileWithPresignedUrl(this.courseId!, this.selectedImageFile!)
        .subscribe({
          next: (result) => {
            this.uploadProgress = result.progress.percentage;
            console.log(`📊 Progreso de subida: ${result.progress.percentage}%`);
            
            if (result.progress.percentage === 100 && result.fileKey) {
              this.isUploading = false;
              // Construir la URL final usando la fileKey
              const imageUrl = `https://ai-nedi-learning-resources.s3.amazonaws.com/${result.fileKey}`;
              console.log('✅ Imagen subida exitosamente:', imageUrl);
              resolve(imageUrl);
            }
          },
          error: (error) => {
            this.isUploading = false;
            console.error('❌ Error uploading image:', error);
            reject(error);
          }
        });
    });
  }





  isFieldInvalid(fieldName: string): boolean {
    const field = this.courseForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  isFormValid(): boolean {
    const formValid = this.courseForm.valid;
    const hasImage = this.selectedImage || this.courseForm.get('imageUrl')?.value;
    
    console.log('🔍 isFormValid - Verificando:', {
      formValid,
      selectedImage: !!this.selectedImage,
      imageUrlValue: this.courseForm.get('imageUrl')?.value,
      hasImage,
      finalResult: formValid && !!hasImage
    });
    
    // El formulario es válido si todos los campos requeridos están completos Y hay una imagen
    return formValid && !!hasImage;
  }

  getFieldError(fieldName: string): string {
    const field = this.courseForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['minlength']) return `La longitud mínima es de ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['maxlength']) return `La longitud máxima es de ${field.errors['maxlength'].requiredLength} caracteres`;
    if (field.errors['min']) return `El valor mínimo es ${field.errors['min'].min}`;
    if (field.errors['pattern']) return 'Por favor ingresa una URL válida';

    return 'Valor inválido';
  }
} 