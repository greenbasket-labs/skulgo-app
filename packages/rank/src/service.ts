import type { AggregateResult } from "../../aggregate/src/model";
import type { RankEntry, RankResult } from "./model";

export interface RankPermission { canView: boolean; }

export interface RankQuery {
  schoolId: string;
  classId: string;
  sessionId: string;
  termId: string;
}

export class RankService {
  getRank(query: RankQuery, aggregates: AggregateResult[], permission: RankPermission): RankResult {
    if (!permission.canView) throw new Error("Rank view permission required");

    const matching = aggregates.filter(
      (aggregate) =>
        aggregate.schoolId === query.schoolId &&
        aggregate.classId === query.classId &&
        aggregate.sessionId === query.sessionId &&
        aggregate.termId === query.termId,
    );

    const ordered = matching
      .filter((aggregate) => aggregate.average !== undefined)
      .sort((a, b) => (b.average as number) - (a.average as number));

    const entries: RankEntry[] = matching.map((aggregate) => ({
      studentId: aggregate.studentId,
      subjectsOffered: aggregate.subjectsOffered,
      ...(aggregate.overallTotal !== undefined ? { overallTotal: aggregate.overallTotal } : {}),
      ...(aggregate.average !== undefined ? { average: aggregate.average } : {}),
    }));

    const byStudentId = new Map(entries.map((entry) => [entry.studentId, entry]));

    ordered.forEach((aggregate, index) => {
      const entry = byStudentId.get(aggregate.studentId);
      if (!entry) return;
      const previous = ordered[index - 1];
      entry.position =
        previous && previous.average === aggregate.average
          ? byStudentId.get(previous.studentId)?.position
          : index + 1;
    });

    return {
      rankId: [query.schoolId, query.classId, query.sessionId, query.termId].join(":"),
      ...query,
      entries,
    };
  }
}
