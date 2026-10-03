import type { ResultsService, ResultsPermission, ResultsQuery } from "../../results/src/service";
import type { TotalResult } from "./model";

export class TotalsService {
  constructor(private readonly results: ResultsService) {}

  async getTotal(query: ResultsQuery, permission: ResultsPermission): Promise<TotalResult> {
    const result = await this.results.getResult(query, permission);
    const caTotal = result.caRecords.length
      ? result.caRecords.reduce((sum, record) => sum + record.score, 0)
      : undefined;
    const examScore = result.examRecords.length
      ? result.examRecords.reduce((sum, record) => sum + record.score, 0)
      : undefined;

    const available = [caTotal, examScore].filter(
      (value): value is number => value !== undefined,
    );

    return {
      totalId: [
        query.schoolId,
        query.studentId,
        query.classId,
        query.subjectId,
        query.sessionId,
        query.termId,
      ].join(":"),
      ...query,
      caTotal,
      examScore,
      combinedTotal: available.length ? available.reduce((sum, value) => sum + value, 0) : undefined,
    };
  }
}
