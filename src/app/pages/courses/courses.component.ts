import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { CourseCardComponent } from '../../components/course-card/course-card.component';
import { StudentCourse } from '../../models/course.model';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, CourseCardComponent],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class CoursesComponent implements OnInit {
  courses: StudentCourse[] = [
    {
      id: '1',
      title: 'ISO 9001:2015',
      description: 'Quality Management Systems',
      category: 'Quality Management',
      level: 'intermediate',
      duration: '40 hours',
      price: 299,
      imageUrl: 'https://placehold.co/400x300/2563eb/ffffff?text=ISO+9001',
      status: 'not_started',
      progress: 0,
      lastUpdated: new Date('2024-01-15'),
      rating: 4.5
    },
    {
      id: '2',
      title: 'ISO 14001:2015',
      description: 'Environmental Management Systems',
      category: 'Environmental Management',
      level: 'intermediate',
      duration: '35 hours',
      price: 349,
      imageUrl: 'https://placehold.co/400x300/059669/ffffff?text=ISO+14001',
      status: 'in_progress',
      progress: 35,
      lastUpdated: new Date('2024-02-01'),
      rating: 4.8,
      lastAccessed: new Date('2024-03-10')
    },
    {
      id: '3',
      title: 'ISO 27001:2013',
      description: 'Information Security Management',
      category: 'Information Security',
      level: 'advanced',
      duration: '45 hours',
      price: 399,
      imageUrl: 'https://placehold.co/400x300/7c3aed/ffffff?text=ISO+27001',
      status: 'not_started',
      progress: 0,
      lastUpdated: new Date('2024-01-20'),
      rating: 4.7
    },
    {
      id: '4',
      title: 'ISO 45001:2018',
      description: 'Occupational Health and Safety',
      category: 'Health & Safety',
      level: 'intermediate',
      duration: '38 hours',
      price: 329,
      imageUrl: 'https://placehold.co/400x300/dc2626/ffffff?text=ISO+45001',
      status: 'completed',
      progress: 100,
      lastUpdated: new Date('2024-01-10'),
      rating: 4.9,
      lastAccessed: new Date('2024-03-05')
    },
    {
      id: '5',
      title: 'ISO 22000:2018',
      description: 'Food Safety Management',
      category: 'Food Safety',
      level: 'advanced',
      duration: '42 hours',
      price: 379,
      imageUrl: 'https://placehold.co/400x300/ea580c/ffffff?text=ISO+22000',
      status: 'in_progress',
      progress: 60,
      lastUpdated: new Date('2024-02-15'),
      rating: 4.6,
      lastAccessed: new Date('2024-03-12')
    },
    {
      id: '6',
      title: 'ISO 50001:2018',
      description: 'Energy Management Systems',
      category: 'Energy Management',
      level: 'intermediate',
      duration: '36 hours',
      price: 359,
      imageUrl: 'https://placehold.co/400x300/0891b2/ffffff?text=ISO+50001',
      status: 'not_started',
      progress: 0,
      lastUpdated: new Date('2024-02-20'),
      rating: 4.4
    }
  ];

  filteredCourses: StudentCourse[] = [];
  searchQuery: string = '';
  selectedCategory: string = 'all';
  categories: string[] = ['all', 'Quality Management', 'Environmental Management', 'Information Security', 'Health & Safety', 'Food Safety', 'Energy Management'];

  ngOnInit() {
    this.filteredCourses = [...this.courses];
  }

  filterCourses() {
    this.filteredCourses = this.courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesCategory = this.selectedCategory === 'all' || course.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.filterCourses();
  }
} 