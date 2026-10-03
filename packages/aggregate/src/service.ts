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

      subjectTotals.push({
        subjectId,
        ...(total.combinedTotal !== undefined
          ? { total: total.combinedTotal }
          : {}),
      });
    }

    const validTotals = subjectTotals
      .map((subject) => subject.total)
      .filter((value): value is number => value !== undefined);

    const overallTotal = validTotals.length
      ? validTotals.reduce((sum, value) => sum + value, 0)
      : undefined;

    const subjectsOffered = query.subjectIds.length;
    const subjectsWithTotal = validTotals.length;

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
      subjectsOffered,
      subjectsWithTotal,
      subjectsMissingTotal: subjectsOffered - subjectsWithTotal,
      overallTotal,
      average: subjectsOffered
        ? (overallTotal ?? 0) / subjectsOffered
        : undefined,
      subjectTotals,
    };
  }
}
