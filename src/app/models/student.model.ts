export interface Student {
  id: string;
  name: string;
  documentNumber: string;
  phoneNumber: string;
  courseId: string;
  enrolledAt: Date;
}

export interface StudentCSV {
  name: string;
  documentNumber: string;
  phoneNumber: string;
} 