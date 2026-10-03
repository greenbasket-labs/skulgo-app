import type { ResultsPermission, ResultsQuery } from "../../results/src/service";
import type { TotalsService } from "../../totals/src/service";
import type { GradeResult, GradeScale } from "./model";

export interface GradePermission { canView: boolean; }

export class GradeService {
  constructor(private readonly totals: TotalsService) {}

  async getGrade(query: ResultsQuery, scale: GradeScale, permission: GradePermission): Promise<GradeResult> {
    if (!permission.canView) throw new Error("Grade viewing not permitted");
    if (scale.schoolId !== query.schoolId) throw new Error("Grade scale belongs to another school");

    const sorted = [...scale.bands].sort((a, b) => a.minimumTotal - b.minimumTotal);
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i].minimumTotal <= sorted[i - 1].maximumTotal) {
        throw new Error("Grade scale has overlapping bands");
      }
    }

    const total = await this.totals.getTotal(query, { canView: true } satisfies ResultsPermission);
    const value = total.combinedTotal;
    const gradeResultId = [query.schoolId,query.studentId,query.classId,query.subjectId,query.sessionId,query.termId].join(":");
    if (value === undefined) return { gradeResultId, ...query };
    const matching = scale.bands.filter((band) => value >= band.minimumTotal && value <= band.maximumTotal);
    return { gradeResultId, ...query, total: value, grade: matching[0]?.label };
  }
}