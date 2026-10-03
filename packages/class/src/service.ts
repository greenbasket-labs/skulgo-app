import type { SchoolClass } from "./model";
import type { ClassRepository } from "./repository";

export interface ClassPermission {
  canManage: boolean;
  canView: boolean;
}

export class ClassService {
  constructor(private readonly repository: ClassRepository) {}

  async create(item: SchoolClass, permission: ClassPermission): Promise<SchoolClass> {
    if (!permission.canManage) throw new Error("Class management not permitted");
    if (!item.name.trim()) throw new Error("Class name is required");
    await this.repository.save({ ...item, name: item.name.trim() });
    return { ...item, name: item.name.trim() };
  }

  async rename(classId: string, name: string, permission: ClassPermission): Promise<SchoolClass> {
    if (!permission.canManage) throw new Error("Class management not permitted");
    if (!name.trim()) throw new Error("Class name is required");
    const item = await this.repository.get(classId);
    if (!item) throw new Error("Class not found");
    const updated = { ...item, name: name.trim() };
    await this.repository.save(updated);
    return updated;
  }

  async list(schoolId: string, permission: ClassPermission): Promise<SchoolClass[]> {
    if (!permission.canView) throw new Error("Class viewing not permitted");
    return this.repository.list(schoolId);
  }
}
