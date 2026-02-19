import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudentCourse } from '../../models/course.model';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.css']
})
export class CourseCardComponent {
  @Input() course!: StudentCourse;

  getLevelClass(): string {
    return `level-${this.course.level}`;
  }

  getLevelLabel(): string {
    const levelLabels: Record<string, string> = {
      'beginner': 'Principiante',
      'intermediate': 'Intermedio',
      'advanced': 'Avanzado'
    };
    return levelLabels[this.course.level] || this.course.level;
  }
} 