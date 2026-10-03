import type { CAAssessment, ContinuousAssessment } from "./model";

export interface CARepository {
  saveAssessment(assessment: CAAssessment): Promise<void>;
  getAssessment(assessmentId: string): Promise<CAAssessment | undefined>;
  saveRecord(record: ContinuousAssessment): Promise<void>;
  getRecord(caId: string): Promise<ContinuousAssessment | undefined>;
  listAssessments(schoolId: string): Promise<CAAssessment[]>;
  listRecords(schoolId: string): Promise<ContinuousAssessment[]>;
}
