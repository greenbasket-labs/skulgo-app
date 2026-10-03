import type { Exam, ExamScore } from "./model";
import type { ExamRepository } from "./repository";

export class InMemoryExamRepository implements ExamRepository {
  private readonly exams = new Map<string, Exam>();
  private readonly scores = new Map<string, ExamScore>();

  async saveExam(exam: Exam): Promise<void> { this.exams.set(exam.examId, exam); }
  async getExam(examId: string): Promise<Exam | undefined> { return this.exams.get(examId); }
  async saveScore(score: ExamScore): Promise<void> { this.scores.set(score.examScoreId, score); }
  async getScore(examScoreId: string): Promise<ExamScore | undefined> { return this.scores.get(examScoreId); }
  async listExams(schoolId: string): Promise<Exam[]> {
    return [...this.exams.values()].filter((item) => item.schoolId === schoolId);
  }
  async listScores(schoolId: string): Promise<ExamScore[]> {
    return [...this.scores.values()].filter((item) => item.schoolId === schoolId);
  }
}
