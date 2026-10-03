export interface ContinuousAssessment {
  caId: string;
  schoolId: string;
  studentId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  sessionId: string;
  termId: string;
  assessmentName: string;
  maximumScore: number;
  score: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CAAssessment {
  assessmentId: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  sessionId: string;
  termId: string;
  name: string;
  maximumScore: number;
  date: string;
  createdAt: string;
}
