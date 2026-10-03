export interface AggregateSubjectTotal {
  subjectId: string;
  total?: number;
}

export interface AggregateResult {
  aggregateId: string;
  schoolId: string;
  studentId: string;
  classId: string;
  sessionId: string;
  termId: string;
  subjectsOffered: number;
  subjectsWithTotal: number;
  subjectsMissingTotal: number;
  overallTotal?: number;
  average?: number;
  subjectTotals: AggregateSubjectTotal[];
}
