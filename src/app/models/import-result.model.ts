import { Student } from './student.model';

export interface ImportResult {
  success: number;
  failed: number;
  errors: ImportError[];
  createdStudents: Student[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}
