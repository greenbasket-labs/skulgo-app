export interface Exam {
  examId: string;
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

export interface ExamScore {
  examScoreId: string;
  examId: string;
  schoolId: string;
  studentId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  sessionId: string;
  termId: string;
  score: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}
