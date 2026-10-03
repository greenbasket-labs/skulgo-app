import type { Exam, ExamScore } from "./model";

export interface ExamRepository {
  saveExam(exam: Exam): Promise<void>;
  getExam(examId: string): Promise<Exam | undefined>;
  saveScore(score: ExamScore): Promise<void>;
  getScore(examScoreId: string): Promise<ExamScore | undefined>;
  listExams(schoolId: string): Promise<Exam[]>;
  listScores(schoolId: string): Promise<ExamScore[]>;
}
