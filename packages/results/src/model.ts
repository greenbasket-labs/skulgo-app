import type { SchoolRecord } from "../../school-records/src/record";

export interface AssessmentPayload {
  score: number;
  maxScore: number;
}

export interface SubjectResultPayload {
  ca?: AssessmentPayload;
  exam?: AssessmentPayload;
  total?: number;
  grade?: string;
}

export type AssessmentRecord = SchoolRecord<AssessmentPayload>;
export type SubjectResultRecord = SchoolRecord<SubjectResultPayload>;
