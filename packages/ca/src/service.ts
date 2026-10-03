import type { TeachingAssignment } from "../../assignment/src/model";
import type { AssignmentRepository } from "../../assignment/src/repository";
import type { Student } from "../../admission/src/model";
import type { AdmissionStudentRepository } from "../../admission/src/repository";
import type { SchoolContract } from "../../school/src/contract";
import type { CARepository } from "./repository";
import type { CAAssessment, ContinuousAssessment } from "./model";

export interface CAPermission {
  canManage: boolean;
  canView: boolean;
}

export class CAService {
  constructor(
    private readonly repository: CARepository,
    private readonly assignmentRepository: AssignmentRepository,
    private readonly admissionRepository: AdmissionStudentRepository,
    private readonly schoolContract: SchoolContract,
  ) {}

  async createAssessment(
    assessment: CAAssessment,
    permission: CAPermission,
  ): Promise<CAAssessment> {
    if (!permission.canManage) throw new Error("CA management not permitted");
    if (!assessment.name.trim()) throw new Error("Assessment name is required");
    this.validateMaximum(assessment.maximumScore);

    const assignments = await this.assignmentRepository.list(assessment.schoolId);
    const assignment = assignments.find((item) =>
      item.teacherId === assessment.teacherId &&
      item.classId === assessment.classId &&
      item.subjectId === assessment.subjectId &&
      item.status === "ACTIVE"
    );
    if (!assignment) {
      throw new Error("Teacher is not assigned to this class and subject");
    }
    if (assignment.teacherId !== assessment.teacherId) {
      throw new Error("Teacher is not assigned to this class and subject");
    }

    await this.validateCurrentTerm(assessment.schoolId, assessment.sessionId, assessment.termId);
    const created = { ...assessment, name: assessment.name.trim() };
    await this.repository.saveAssessment(created);
    return created;
  }

  async saveScore(
    record: ContinuousAssessment,
    permission: CAPermission,
  ): Promise<ContinuousAssessment> {
    if (!permission.canManage) throw new Error("CA management not permitted");
    const assessments = await this.repository.listAssessments(record.schoolId);
    const assessment = assessments.find((item) =>
      item.name === record.assessmentName &&
      item.classId === record.classId &&
      item.subjectId === record.subjectId &&
      item.teacherId === record.teacherId &&
      item.sessionId === record.sessionId &&
      item.termId === record.termId
    );
    if (!assessment) throw new Error("Assessment not found");
    if (assessment.schoolId !== record.schoolId || assessment.classId !== record.classId ||
        assessment.subjectId !== record.subjectId || assessment.teacherId !== record.teacherId ||
        assessment.sessionId !== record.sessionId || assessment.termId !== record.termId) {
      throw new Error("CA record does not match assessment");
    }

    const student = await this.admissionRepository.getStudent(record.studentId);
    this.validateStudent(student, record);

    if (!Number.isFinite(record.score) || record.score < 0 || record.score > assessment.maximumScore) {
      throw new Error("Score must be between 0 and the assessment maximum");
    }

    const now = new Date().toISOString();
    const saved = {
      ...record,
      maximumScore: assessment.maximumScore,
      assessmentName: assessment.name,
      updatedAt: now,
    };
    await this.repository.saveRecord(saved);
    return saved;
  }

  async listAssessments(schoolId: string, permission: CAPermission): Promise<CAAssessment[]> {
    if (!permission.canView) throw new Error("CA viewing not permitted");
    return this.repository.listAssessments(schoolId);
  }

  async listRecords(schoolId: string, permission: CAPermission): Promise<ContinuousAssessment[]> {
    if (!permission.canView) throw new Error("CA viewing not permitted");
    return this.repository.listRecords(schoolId);
  }

  private async validateCurrentTerm(schoolId: string, sessionId: string, termId: string): Promise<void> {
    const session = await this.schoolContract.getCurrentSession(schoolId);
    const term = await this.schoolContract.getCurrentTerm(schoolId);
    if (!session || session.sessionId !== sessionId) throw new Error("Session is not valid for this school");
    if (!term || term.termId !== termId) throw new Error("Term is not valid for this school");
  }

  private validateStudent(student: Student | undefined, record: ContinuousAssessment): void {
    if (!student) throw new Error("Student not found");
    if (student.schoolId !== record.schoolId || student.classId !== record.classId) {
      throw new Error("Student does not belong to this class");
    }
  }

  private validateMaximum(maximumScore: number): void {
    if (!Number.isFinite(maximumScore) || maximumScore <= 0) {
      throw new Error("Maximum score must be greater than zero");
    }
  }
}
