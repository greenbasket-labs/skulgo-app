import type { SchoolClass } from "./model";
import type { ClassRepository } from "./repository";

export class InMemoryClassRepository implements ClassRepository {
  private readonly items = new Map<string, SchoolClass>();

  async save(item: SchoolClass): Promise<void> {
    this.items.set(item.classId, item);
  }

  async get(classId: string): Promise<SchoolClass | undefined> {
    return this.items.get(classId);
  }

  async list(schoolId: string): Promise<SchoolClass[]> {
    return [...this.items.values()].filter((item) => item.schoolId === schoolId);
  }
}
