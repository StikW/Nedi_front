import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudentCourse } from '../../models/course.model';
import { ReplacePipe } from '../../shared/pipes/replace.pipe';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReplacePipe],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.css']
})
export class CourseListComponent {
  @Input() courses: StudentCourse[] = [];
  @Input() showProgress: boolean = false;
  @Input() showStatus: boolean = false;
  @Input() emptyStateTitle: string = 'No courses found';
  @Input() emptyStateMessage: string = 'Start your learning journey by enrolling in a course.';
  @Input() actionText: string = 'Browse Courses';
  @Input() actionLink: string | null = null;
} 