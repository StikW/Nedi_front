export interface StudentProgress {
  studentId: string;
  studentName: string;
  phoneNumber: string;
  completionPercentage: number;
  completedModules: number;
  totalModules: number;
  enrolledAt: string;
  lastCompletedAt?: string;
  /** Veces que el estudiante ha ingresado al sistema */
  loginCount?: number;
  /** Fecha de la última vez que ingresó (updatedAt del estudiante) */
  lastAccessAt?: string;
}

export interface CourseStats {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  totalModules: number;
  completionRate: number;
  studentProgress?: StudentProgress[];
}

export interface StudentProgressResponse {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  totalModules: number;
  studentProgress: StudentProgress[];
  pagination: {
    page: string;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
