import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CoursesService, PublicCoursePreview } from '../../instructor/courses.service';

@Component({
  selector: 'app-join-course',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './join-course.component.html',
  styleUrls: ['./join-course.component.css']
})
export class JoinCourseComponent implements OnInit {
  courseId: string | null = null;
  preview: PublicCoursePreview | null = null;
  isLoading = true;
  error: string | null = null;
  isSubmitting = false;
  success = false;

  form: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private coursesService: CoursesService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(32)]]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.courseId = params.get('courseId');
      if (this.courseId) {
        this.loadPreview();
      } else {
        this.error = 'Enlace inválido';
        this.isLoading = false;
      }
    });
  }

  private loadPreview(): void {
    if (!this.courseId) return;
    this.isLoading = true;
    this.error = null;
    this.coursesService.getPublicCoursePreview(this.courseId).subscribe({
      next: (data) => {
        this.preview = data;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Este curso no está disponible para registro público o no existe.';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.courseId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    const { name, phoneNumber } = this.form.value;
    this.coursesService.publicEnroll(this.courseId, { name: name.trim(), phoneNumber }).subscribe({
      next: () => {
        this.success = true;
        this.isSubmitting = false;
      },
      error: (err: { error?: { message?: string }; status?: number }) => {
        this.isSubmitting = false;
        const msg = err?.error?.message || (err?.status === 409 ? 'Ya estás inscrito con ese número.' : 'No se pudo completar el registro.');
        this.error = msg;
      }
    });
  }
}
