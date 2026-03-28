import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InstructorCourse, CourseStatus } from '../../models/course.model';
import { environment } from '../../../environments/environment';

/** Sin visibility en API = privado (igual que backend) */
function effectiveVisibility(course: InstructorCourse): 'public' | 'private' {
  return course.visibility === 'public' ? 'public' : 'private';
}

@Component({
  selector: 'app-instructor-course-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './instructor-course-list.component.html',
  styleUrls: ['./instructor-course-list.component.css']
})
export class InstructorCourseListComponent {
  @Input() courses: InstructorCourse[] = [];
  @Input() deletingCourseId: string | null = null;
  @Output() deleteCourse = new EventEmitter<string>();

  /** ID del curso cuyo enlace se acaba de copiar (feedback visual) */
  copiedCourseId: string | null = null;
  private copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

  getStatusLabel(status: CourseStatus): string {
    const statusLabels: Record<CourseStatus, string> = {
      'draft': 'Borrador',
      'published': 'Publicado',
      'archived': 'Archivado'
    };
    return statusLabels[status] || status;
  }

  getVisibilityLabel(course: InstructorCourse): string {
    return effectiveVisibility(course) === 'public' ? 'Público' : 'Privado';
  }

  visibilityClass(course: InstructorCourse): string {
    return effectiveVisibility(course) === 'public' ? 'visibility-public' : 'visibility-private';
  }

  showShareButton(course: InstructorCourse): boolean {
    return course.visibility === 'public' && course.status === 'published';
  }

  publicJoinLink(course: InstructorCourse): string {
    const base = environment.publicAppUrl.replace(/\/$/, '');
    return `${base}/join/${course.id}`;
  }

  copyShareLink(event: Event, course: InstructorCourse): void {
    event.preventDefault();
    event.stopPropagation();
    const url = this.publicJoinLink(course);
    navigator.clipboard.writeText(url).then(() => {
      this.copiedCourseId = course.id;
      if (this.copyFeedbackTimer) {
        clearTimeout(this.copyFeedbackTimer);
      }
      this.copyFeedbackTimer = setTimeout(() => {
        this.copiedCourseId = null;
        this.copyFeedbackTimer = null;
      }, 2000);
    });
  }

  onDeleteCourse(event: Event, courseId: string): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.deletingCourseId === courseId) {
      return;
    }
    this.deleteCourse.emit(courseId);
  }
} 