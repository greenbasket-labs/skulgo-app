import type { SchoolClass } from "./model";

export interface ClassRepository {
  save(item: SchoolClass): Promise<void>;
  get(classId: string): Promise<SchoolClass | undefined>;
  list(schoolId: string): Promise<SchoolClass[]>;
}
