import type { ResultPublication } from "./model";

export interface ResultPublishingRepository {
  save(publication: ResultPublication): Promise<void>;
  get(schoolId: string, studentId: string, sessionId: string, termId: string): Promise<ResultPublication | undefined>;
  list(schoolId: string, classId?: string, sessionId?: string, termId?: string): Promise<ResultPublication[]>;
}
