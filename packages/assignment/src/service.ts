import type { SchoolClass } from "../../class/src/model";
import type { ClassRepository } from "../../class/src/repository";
import type { Subject } from "../../subject/src/model";
import type { SubjectRepository } from "../../subject/src/repository";
import type { Teacher } from "../../teacher/src/model";
import type { TeacherRepository } from "../../teacher/src/repository";
import type { TeachingAssignment } from "./model";
import type { AssignmentRepository } from "./repository";

export interface AssignmentPermission {
  canManage: boolean;
  canView: boolean;
}

export class AssignmentService {
  constructor(
    private readonly repository: AssignmentRepository,
    private readonly teacherRepository: TeacherRepository,
    private readonly classRepository: ClassRepository,
    private readonly subjectRepository: SubjectRepository,
  ) {}

  async create(
    assignment: TeachingAssignment,
    permission: AssignmentPermission,
  ): Promise<TeachingAssignment> {
    if (!permission.canManage) {
      throw new Error("Assignment management not permitted");
    }

    const [teacher, schoolClass, subject] = await Promise.all([
      this.teacherRepository.get(assignment.teacherId),
      this.classRepository.get(assignment.classId),
      this.subjectRepository.get(assignment.subjectId),
    ]);

    this.validateReferences(assignment, teacher, schoolClass, subject);

    await this.repository.save(assignment);
    return assignment;
  }

  async disable(
    assignmentId: string,
    permission: AssignmentPermission,
  ): Promise<TeachingAssignment> {
    if (!permission.canManage) {
      throw new Error("Assignment management not permitted");
    }

    const assignment = await this.repository.get(assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    const updated = { ...assignment, status: "DISABLED" as const };
    await this.repository.save(updated);
    return updated;
  }

  async list(
    schoolId: string,
    permission: AssignmentPermission,
  ): Promise<TeachingAssignment[]> {
    if (!permission.canView) {
      throw new Error("Assignment viewing not permitted");
    }

    return this.repository.list(schoolId);
  }

  private validateReferences(
    assignment: TeachingAssignment,
    teacher: Teacher | undefined,
    schoolClass: SchoolClass | undefined,
    subject: Subject | undefined,
  ): void {
    if (!teacher) throw new Error("Teacher not found");
    if (!schoolClass) throw new Error("Class not found");
    if (!subject) throw new Error("Subject not found");

    if (
      teacher.schoolId !== assignment.schoolId ||
      schoolClass.schoolId !== assignment.schoolId ||
      subject.schoolId !== assignment.schoolId
    ) {
      throw new Error("Assignment references must belong to the same school");
    }

    if (teacher.status !== "ACTIVE") {
      throw new Error("Teacher is not active");
    }

    if (subject.status !== "ACTIVE") {
      throw new Error("Subject is not active");
    }
  }
}
