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
