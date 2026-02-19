import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';

interface LearningPath {
  id: number;
  title: string;
  description: string;
  category: string;
  progress: number;
  currentModule: string;
  nextModule: string;
  estimatedCompletion: Date;
  lastAccessed: Date;
  status: 'in-progress' | 'completed' | 'not-started';
}

@Component({
  selector: 'app-my-learning-path',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './my-learning-path.component.html',
  styleUrls: ['./my-learning-path.component.css']
})
export class MyLearningPathComponent implements OnInit {
  // Stats
  activeCourses: number = 0;
  averageProgress: number = 0;
  learningHours: number = 0;

  // Learning paths
  learningPaths: LearningPath[] = [];
  recommendedPaths: LearningPath[] = [];

  // UI state
  showFilterMenu: boolean = false;
  showSortMenu: boolean = false;

  constructor() {}

  ngOnInit(): void {
    this.loadLearningPaths();
    this.loadRecommendedPaths();
    this.calculateStats();
  }

  private loadLearningPaths(): void {
    // TODO: Implement API call to load user's learning paths
    this.learningPaths = [];
  }

  private loadRecommendedPaths(): void {
    // TODO: Implement API call to load recommended paths
    this.recommendedPaths = [];
  }

  private calculateStats(): void {
    // TODO: Calculate stats from learning paths data
    this.activeCourses = 0;
    this.averageProgress = 0;
    this.learningHours = 0;
  }

  toggleFilterMenu(): void {
    this.showFilterMenu = !this.showFilterMenu;
    if (this.showFilterMenu) {
      this.showSortMenu = false;
    }
  }

  toggleSortMenu(): void {
    this.showSortMenu = !this.showSortMenu;
    if (this.showSortMenu) {
      this.showFilterMenu = false;
    }
  }
} 