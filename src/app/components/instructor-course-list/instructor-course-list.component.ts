import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InstructorCourse, CourseStatus } from '../../models/course.model';

@Component({
  selector: 'app-instructor-course-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './instructor-course-list.component.html',
  styleUrls: ['./instructor-course-list.component.css']
})
export class InstructorCourseListComponent {
  @Input() courses: InstructorCourse[] = [];
  @Output() deleteCourse = new EventEmitter<string>();

  getStatusLabel(status: CourseStatus): string {
    const statusLabels: Record<CourseStatus, string> = {
      'draft': 'Borrador',
      'published': 'Publicado',
      'archived': 'Archivado'
    };
    return statusLabels[status] || status;
  }

  onDeleteCourse(event: Event, courseId: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.deleteCourse.emit(courseId);
  }
} 