export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type CourseProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface BaseCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  duration: string;
  price: number;
  imageUrl: string;
  lastUpdated: Date;
  rating: number;
}

export interface InstructorCourse extends BaseCourse {
  status: CourseStatus;
  students: number;
  objectives: string;
  prerequisites: string;
}

export interface StudentCourse extends BaseCourse {
  status: CourseProgressStatus;
  progress: number;
  lastAccessed?: Date;
}
