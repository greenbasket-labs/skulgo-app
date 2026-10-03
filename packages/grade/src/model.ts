export interface GradeBand {
  gradeId: string; schoolId: string; label: string; minimumTotal: number; maximumTotal: number;
}
export interface GradeResult {
  gradeResultId: string; schoolId: string; studentId: string; classId: string; subjectId: string; sessionId: string; termId: string;
  total?: number; grade?: string;
}
export interface GradeScale { schoolId: string; bands: GradeBand[]; }
