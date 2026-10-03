import type { Subject } from "./model";

export interface SubjectRepository {
  save(subject: Subject): Promise<void>;
  get(subjectId: string): Promise<Subject | undefined>;
  list(schoolId: string): Promise<Subject[]>;
}
