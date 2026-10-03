import type { CARepository } from "../../ca/src/repository";
import type { ExamRepository } from "../../exam/src/repository";
import type { ResultView } from "./model";

export interface ResultsPermission { canView: boolean; }
export interface ResultsQuery {
  schoolId: string; studentId: string; classId: string; subjectId: string; sessionId: string; termId: string;
}
export class ResultsService {
  constructor(private readonly ca: CARepository, private readonly exam: ExamRepository) {}
  async getResult(query: ResultsQuery, permission: ResultsPermission): Promise<ResultView> {
    if (!permission.canView) throw new Error("Results viewing not permitted");
    const [caRecords, exams, examScores] = await Promise.all([
      this.ca.listRecords(query.schoolId), this.exam.listExams(query.schoolId), this.exam.listScores(query.schoolId),
    ]);
    const filteredCA = caRecords.filter((r) =>
      r.studentId === query.studentId && r.classId === query.classId && r.subjectId === query.subjectId &&
      r.sessionId === query.sessionId && r.termId === query.termId
    );
    const filteredScores = examScores.filter((r) =>
      r.studentId === query.studentId && r.classId === query.classId && r.subjectId === query.subjectId &&
      r.sessionId === query.sessionId && r.termId === query.termId
    );
    const examById = new Map(exams.map((exam) => [exam.examId, exam]));
    return {
      resultId: [query.schoolId, query.studentId, query.classId, query.subjectId, query.sessionId, query.termId].join(":"),
      ...query,
      caRecords: filteredCA.map((r) => ({ caId: r.caId, assessmentName: r.assessmentName, score: r.score, maximumScore: r.maximumScore, date: r.date })),
      examRecords: filteredScores.flatMap((r) => {
        const exam = examById.get(r.examId);
        return exam ? [{ examScoreId: r.examScoreId, examId: r.examId, examName: exam.name, score: r.score, maximumScore: exam.maximumScore, date: r.date || exam.date }] : [];
      }),
    };
  }
}
