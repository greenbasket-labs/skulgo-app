import type { Teacher } from "./model";
import type { TeacherRepository } from "./repository";

export interface TeacherPermission {
  canManage: boolean;
  canView: boolean;
}

export class TeacherService {
  constructor(private readonly repository: TeacherRepository) {}

  async create(teacher: Teacher, permission: TeacherPermission): Promise<Teacher> {
    if (!permission.canManage) throw new Error("Teacher management not permitted");
    if (!teacher.fullName.trim()) throw new Error("Teacher name is required");

    const created = {
      ...teacher,
      fullName: teacher.fullName.trim(),
      employeeNumber: teacher.employeeNumber?.trim() || undefined,
      phone: teacher.phone?.trim() || undefined,
      email: teacher.email?.trim() || undefined,
    };

    await this.repository.save(created);
    return created;
  }

  async update(
    teacherId: string,
    changes: Pick<Teacher, "fullName" | "employeeNumber" | "phone" | "email">,
    permission: TeacherPermission,
  ): Promise<Teacher> {
    if (!permission.canManage) throw new Error("Teacher management not permitted");
    if (!changes.fullName.trim()) throw new Error("Teacher name is required");

    const teacher = await this.repository.get(teacherId);
    if (!teacher) throw new Error("Teacher not found");

    const updated = {
      ...teacher,
      fullName: changes.fullName.trim(),
      employeeNumber: changes.employeeNumber?.trim() || undefined,
      phone: changes.phone?.trim() || undefined,
      email: changes.email?.trim() || undefined,
    };

    await this.repository.save(updated);
    return updated;
  }

  async disable(teacherId: string, permission: TeacherPermission): Promise<Teacher> {
    if (!permission.canManage) throw new Error("Teacher management not permitted");

    const teacher = await this.repository.get(teacherId);
    if (!teacher) throw new Error("Teacher not found");

    const updated = { ...teacher, status: "DISABLED" as const };
    await this.repository.save(updated);
    return updated;
  }

  async list(schoolId: string, permission: TeacherPermission): Promise<Teacher[]> {
    if (!permission.canView) throw new Error("Teacher viewing not permitted");
    return this.repository.list(schoolId);
  }
}
