import type { Teacher } from "./model";

export interface TeacherRepository {
  save(teacher: Teacher): Promise<void>;
  get(teacherId: string): Promise<Teacher | undefined>;
  list(schoolId: string): Promise<Teacher[]>;
}
