import type { SchoolRecord } from "../../school-records/src/record";

export interface ResultView {
  resultId: string;
  schoolId: string;
  studentId: string;
  classId: string;
  subjectId: string;
  sessionId: string;
  termId: string;
  caRecords: ResultCARecord[];
  examRecords: ResultExamRecord[];
}

export interface ResultCARecord { caId: string; assessmentName: string; score: number; maximumScore: number; date: string; }
export interface ResultExamRecord { examScoreId: string; examId: string; examName: string; score: number; maximumScore: number; date: string; }

/**
 * Legacy record shape retained for the existing academic-flow compatibility test.
 * The current ResultsService consumes ResultView/CA/Exam records.
 */
export interface SubjectResultRecord extends SchoolRecord<{
  ca: { score: number; maxScore: number };
  exam: { score: number; maxScore: number };
  total: number;
  grade: string;
}> {}