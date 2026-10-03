import type { ResultsPermission, ResultsQuery } from "../../results/src/service";
import type { TotalsService } from "../../totals/src/service";
import type { AggregateResult, AggregateSubjectTotal } from "./model";

export class AggregateService {
  constructor(private readonly totals: TotalsService) {}

  async getAggregate(
    query: Omit<ResultsQuery, "subjectId"> & { subjectIds: string[] },
    permission: ResultsPermission,
  ): Promise<AggregateResult> {
    const subjectTotals: AggregateSubjectTotal[] = [];

    for (const subjectId of query.subjectIds) {
      const total = await this.totals.getTotal(
        { ...query, subjectId },
        permission,
      );

      if (total.combinedTotal !== undefined) {
        subjectTotals.push({
          subjectId,
          total: total.combinedTotal,
        });
      }
    }

    const validTotals = subjectTotals
      .map((subject) => subject.total)
      .filter((value): value is number => value !== undefined);

    const overallTotal = validTotals.length
      ? validTotals.reduce((sum, value) => sum + value, 0)
      : undefined;

    return {
      aggregateId: [
        query.schoolId,
        query.studentId,
        query.classId,
        query.sessionId,
        query.termId,
      ].join(":"),
      schoolId: query.schoolId,
      studentId: query.studentId,
      classId: query.classId,
      sessionId: query.sessionId,
      termId: query.termId,
      subjectCount: validTotals.length,
      overallTotal,
      average: validTotals.length ? (overallTotal as number) / validTotals.length : undefined,
      subjectTotals,
    };
  }
}
