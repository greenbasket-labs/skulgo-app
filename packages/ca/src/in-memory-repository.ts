import type { CARepository } from "./repository";
import type { CAAssessment, ContinuousAssessment } from "./model";

export class InMemoryCARepository implements CARepository {
  private readonly assessments = new Map<string, CAAssessment>();
  private readonly records = new Map<string, ContinuousAssessment>();

  async saveAssessment(assessment: CAAssessment): Promise<void> {
    this.assessments.set(assessment.assessmentId, assessment);
  }

  async getAssessment(assessmentId: string): Promise<CAAssessment | undefined> {
    return this.assessments.get(assessmentId);
  }

  async saveRecord(record: ContinuousAssessment): Promise<void> {
    this.records.set(record.caId, record);
  }

  async getRecord(caId: string): Promise<ContinuousAssessment | undefined> {
    return this.records.get(caId);
  }

  async listAssessments(schoolId: string): Promise<CAAssessment[]> {
    return [...this.assessments.values()].filter((item) => item.schoolId === schoolId);
  }

  async listRecords(schoolId: string): Promise<ContinuousAssessment[]> {
    return [...this.records.values()].filter((item) => item.schoolId === schoolId);
  }
}
