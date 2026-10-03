import type { Teacher } from "./model";
import type { TeacherRepository } from "./repository";

export class InMemoryTeacherRepository implements TeacherRepository {
  private readonly items = new Map<string, Teacher>();

  async save(teacher: Teacher): Promise<void> {
    this.items.set(teacher.teacherId, teacher);
  }

  async get(teacherId: string): Promise<Teacher | undefined> {
    return this.items.get(teacherId);
  }

  async list(schoolId: string): Promise<Teacher[]> {
    return [...this.items.values()].filter((item) => item.schoolId === schoolId);
  }
}
