import type { AssignmentRepository } from "../../assignment/src/repository";
import type { AdmissionStudentRepository } from "../../admission/src/repository";
import type { Student } from "../../admission/src/model";
import type { SchoolContract } from "../../school/src/contract";
import type { Exam, ExamScore } from "./model";
import type { ExamRepository } from "./repository";

export interface ExamPermission {
  canManage: boolean;
  canView: boolean;
}

export class ExamService {
  constructor(
    private readonly repository: ExamRepository,
    private readonly assignmentRepository: AssignmentRepository,
    private readonly admissionRepository: AdmissionStudentRepository,
    private readonly schoolContract: SchoolContract,
  ) {}

  async createExam(exam: Exam, permission: ExamPermission): Promise<Exam> {
    if (!permission.canManage) throw new Error("Exam management not permitted");
    if (!exam.name.trim()) throw new Error("Exam name is required");
    this.validateMaximum(exam.maximumScore);

    const assignments = await this.assignmentRepository.list(exam.schoolId);
    const assignment = assignments.find((item) =>
      item.teacherId === exam.teacherId &&
      item.classId === exam.classId &&
      item.subjectId === exam.subjectId &&
      item.status === "ACTIVE"
    );
    if (!assignment) throw new Error("Teacher is not assigned to this class and subject");

    await this.validateCurrentTerm(exam.schoolId, exam.sessionId, exam.termId);
    const created = { ...exam, name: exam.name.trim() };
    await this.repository.saveExam(created);
    return created;
  }

  async saveScore(score: ExamScore, permission: ExamPermission): Promise<ExamScore> {
    if (!permission.canManage) throw new Error("Exam management not permitted");

    const exam = await this.repository.getExam(score.examId);
    if (!exam) throw new Error("Exam not found");

    if (
      exam.schoolId !== score.schoolId ||
      exam.classId !== score.classId ||
      exam.subjectId !== score.subjectId ||
      exam.teacherId !== score.teacherId ||
      exam.sessionId !== score.sessionId ||
      exam.termId !== score.termId
    ) throw new Error("Exam score does not match exam");

    const student = await this.admissionRepository.getStudent(score.studentId);
    this.validateStudent(student, score);

    const assignments = await this.assignmentRepository.list(score.schoolId);
    const assigned = assignments.some((item) =>
      item.teacherId === score.teacherId &&
      item.classId === score.classId &&
      item.subjectId === score.subjectId &&
      item.status === "ACTIVE"
    );
    if (!assigned) throw new Error("Teacher is not assigned to this class and subject");

    if (!Number.isFinite(score.score) || score.score < 0 || score.score > exam.maximumScore) {
      throw new Error("Score must be between 0 and the exam maximum");
    }

    const now = new Date().toISOString();
    const saved = { ...score, updatedAt: now, date: score.date || exam.date };
    await this.repository.saveScore(saved);
    return saved;
  }

  async listExams(schoolId: string, permission: ExamPermission): Promise<Exam[]> {
    if (!permission.canView) throw new Error("Exam viewing not permitted");
    return this.repository.listExams(schoolId);
  }

  async listScores(schoolId: string, permission: ExamPermission): Promise<ExamScore[]> {
    if (!permission.canView) throw new Error("Exam viewing not permitted");
    return this.repository.listScores(schoolId);
  }

  private async validateCurrentTerm(schoolId: string, sessionId: string, termId: string): Promise<void> {
    const session = await this.schoolContract.getCurrentSession(schoolId);
    const term = await this.schoolContract.getCurrentTerm(schoolId);
    if (!session || session.sessionId !== sessionId) throw new Error("Session is not valid for this school");
    if (!term || term.termId !== termId) throw new Error("Term is not valid for this school");
  }

  private validateStudent(student: Student | undefined, score: ExamScore): void {
    if (!student) throw new Error("Student not found");
    if (student.schoolId !== score.schoolId || student.classId !== score.classId) {
      throw new Error("Student does not belong to this class");
    }
  }

  private validateMaximum(maximumScore: number): void {
    if (!Number.isFinite(maximumScore) || maximumScore <= 0) {
      throw new Error("Maximum score must be greater than zero");
    }
  }
}
