import type { AttendanceSummary } from "../../attendance/src/model";
import type { AggregateResult } from "../../aggregate/src/model";
import type { SchoolProfile } from "../../school/src/domain";
import type { GradeScale } from "../../grade/src/model";
import type { ResultsQuery } from "../../results/src/service";
import type { RankEntry } from "../../rank/src/model";
import type { GradeService, GradePermission } from "../../grade/src/service";
import type { ReportCard } from "./model";

export interface ReportCardPermission { canView: boolean; }

export interface ReportCardQuery {
  school: Pick<SchoolProfile, "schoolId" | "name">;
  studentId: string;
  classId: string;
  sessionId: string;
  termId: string;
  subjectIds: string[];
  gradeScale: GradeScale;
  aggregate: AggregateResult;
  rankEntry?: RankEntry;
  attendance: AttendanceSummary;
}

export class ReportCardService {
  constructor(private readonly grades: GradeService) {}

  async getReportCard(
    query: ReportCardQuery,
    permission: ReportCardPermission,
  ): Promise<ReportCard> {
    if (!permission.canView) throw new Error("Report card viewing not permitted");
    if (query.school.schoolId !== query.aggregate.schoolId) {
      throw new Error("Report card school does not match aggregate school");
    }
    if (
      query.aggregate.studentId !== query.studentId ||
      query.aggregate.classId !== query.classId ||
      query.aggregate.sessionId !== query.sessionId ||
      query.aggregate.termId !== query.termId
    ) {
      throw new Error("Report card aggregate does not match student context");
    }

    const subjects = await Promise.all(
      query.subjectIds.map(async (subjectId) => {
        const gradeQuery: ResultsQuery = {
          schoolId: query.school.schoolId,
          studentId: query.studentId,
          classId: query.classId,
          subjectId,
          sessionId: query.sessionId,
          termId: query.termId,
        };
        const grade = await this.grades.getGrade(
          gradeQuery,
          query.gradeScale,
          { canView: true } satisfies GradePermission,
        );
        return {
          subjectId,
          ...(grade.total !== undefined ? { total: grade.total } : {}),
          ...(grade.grade !== undefined ? { grade: grade.grade } : {}),
        };
      }),
    );

    return {
      reportCardId: [
        query.school.schoolId,
        query.studentId,
        query.classId,
        query.sessionId,
        query.termId,
      ].join(":"),
      school: query.school,
      studentId: query.studentId,
      classId: query.classId,
      sessionId: query.sessionId,
      termId: query.termId,
      subjects,
      subjectsOffered: query.aggregate.subjectsOffered,
      ...(query.aggregate.overallTotal !== undefined
        ? { overallTotal: query.aggregate.overallTotal }
        : {}),
      ...(query.aggregate.average !== undefined
        ? { average: query.aggregate.average }
        : {}),
      ...(query.rankEntry?.position !== undefined
        ? { position: query.rankEntry.position }
        : {}),
      attendance: query.attendance,
    };
  }
}
