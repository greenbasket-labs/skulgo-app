import type { Subject } from "./model";
import type { SubjectRepository } from "./repository";

export interface SubjectPermission {
  canManage: boolean;
  canView: boolean;
}

export class SubjectService {
  constructor(private readonly repository: SubjectRepository) {}

  async create(subject: Subject, permission: SubjectPermission): Promise<Subject> {
    if (!permission.canManage) throw new Error("Subject management not permitted");
    if (!subject.name.trim()) throw new Error("Subject name is required");

    const created = { ...subject, name: subject.name.trim() };
    await this.repository.save(created);
    return created;
  }

  async rename(
    subjectId: string,
    name: string,
    permission: SubjectPermission,
  ): Promise<Subject> {
    if (!permission.canManage) throw new Error("Subject management not permitted");
    if (!name.trim()) throw new Error("Subject name is required");

    const subject = await this.repository.get(subjectId);
    if (!subject) throw new Error("Subject not found");

    const updated = { ...subject, name: name.trim() };
    await this.repository.save(updated);
    return updated;
  }

  async disable(subjectId: string, permission: SubjectPermission): Promise<Subject> {
    if (!permission.canManage) throw new Error("Subject management not permitted");

    const subject = await this.repository.get(subjectId);
    if (!subject) throw new Error("Subject not found");

    const updated = { ...subject, status: "DISABLED" as const };
    await this.repository.save(updated);
    return updated;
  }

  async list(schoolId: string, permission: SubjectPermission): Promise<Subject[]> {
    if (!permission.canView) throw new Error("Subject viewing not permitted");
    return this.repository.list(schoolId);
  }
}
