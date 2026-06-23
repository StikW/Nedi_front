import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { InstructorGuard } from './core/guards/instructor.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'register',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'join/:courseId',
    loadComponent: () => import('./pages/public/join-course/join-course.component').then(m => m.JoinCourseComponent)
  },
  {
    path: 'courses',
    loadComponent: () => import('./pages/courses/courses.component').then(m => m.CoursesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'my-learning-path',
    loadComponent: () => import('./pages/my-learning-path/my-learning-path.component').then(m => m.MyLearningPathComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'instructor',
    canActivate: [InstructorGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/instructor/instructor-dashboard.component').then(m => m.InstructorDashboardComponent)
      },
      {
        path: 'courses/new',
        loadComponent: () => import('./pages/instructor/course-editor/course-editor.component').then(m => m.CourseEditorComponent)
      },
      {
        path: 'courses/:id/edit',
        loadComponent: () => import('./pages/instructor/course-details/course-details.component').then(m => m.CourseDetailsComponent),
        data: { panel: 'edit' }
      },
      {
        path: 'courses/:id/students',
        loadComponent: () => import('./pages/instructor/course-details/course-details.component').then(m => m.CourseDetailsComponent),
        data: { panel: 'students' }
      },
      {
        path: 'courses/:id',
        loadComponent: () => import('./pages/instructor/course-details/course-details.component').then(m => m.CourseDetailsComponent)
      },
      {
        path: 'agent-config',
        loadComponent: () => import('./pages/instructor/course-agent-config/course-agent-config.component').then(m => m.CourseAgentConfigComponent)
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    loadComponent: () => import('./pages/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./pages/admin/admin-notifications.component').then(m => m.AdminNotificationsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
