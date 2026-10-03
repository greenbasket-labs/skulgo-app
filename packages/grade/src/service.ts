import type { ResultsPermission, ResultsQuery } from "../../results/src/service";
import type { TotalsService } from "../../totals/src/service";
import type { GradeResult, GradeScale } from "./model";
export interface GradePermission { canView: boolean; }
export class GradeService {
  constructor(private readonly totals: TotalsService) {}
  async getGrade(query: ResultsQuery, scale: GradeScale, permission: GradePermission): Promise<GradeResult> {
    if (!permission.canView) throw new Error("Grade viewing not permitted");
    if (scale.schoolId !== query.schoolId) throw new Error("Grade scale belongs to another school");
    const total = await this.totals.getTotal(query, { canView: true } satisfies ResultsPermission);
    const value = total.combinedTotal;
    const gradeResultId = [query.schoolId,query.studentId,query.classId,query.subjectId,query.sessionId,query.termId].join(":");
    if (value === undefined) return { gradeResultId, ...query };
    const matching = scale.bands.filter((band) => value >= band.minimumTotal && value <= band.maximumTotal);
    if (matching.length > 1) throw new Error("Grade scale has overlapping bands");
    return { gradeResultId, ...query, total: value, grade: matching[0]?.label };
  }
}
