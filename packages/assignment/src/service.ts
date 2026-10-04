import type { SchoolClass } from "../../class/src/model";
import type { ClassRepository } from "../../class/src/repository";
import type { Subject } from "../../subject/src/model";
import type { SubjectRepository } from "../../subject/src/repository";
import type { Teacher } from "../../teacher/src/model";
import type { TeacherRepository } from "../../teacher/src/repository";
import type { TeachingAssignment } from "./model";
import type { AssignmentRepository } from "./repository";

export interface AssignmentPermission { canManage: boolean; canView: boolean; }

export class AssignmentService {
  constructor(
    private readonly repository: AssignmentRepository,
    private readonly teacherRepository: TeacherRepository,
    private readonly classRepository: ClassRepository,
    private readonly subjectRepository: SubjectRepository,
  ) {}

  async create(assignment: TeachingAssignment, permission: AssignmentPermission): Promise<TeachingAssignment> {
    if (!permission.canManage) throw new Error("Assignment management not permitted");
    this.validateAssignmentShape(assignment);
    const [teacher, schoolClass] = await Promise.all([
      this.teacherRepository.get(assignment.teacherId),
      this.classRepository.get(assignment.classId),
    ]);
    const subject = assignment.assignmentType === "SUBJECT_TEACHER" && assignment.subjectId
      ? await this.subjectRepository.get(assignment.subjectId) : undefined;
    this.validateReferences(assignment, teacher, schoolClass, subject);
    const existing = await this.repository.list(assignment.schoolId);
    if (assignment.status === "ACTIVE" && existing.some((item) => {
      if (item.status !== "ACTIVE" || item.assignmentType !== assignment.assignmentType || item.classId !== assignment.classId) return false;
      return assignment.assignmentType === "CLASS_MASTER" || item.subjectId === assignment.subjectId;
    })) {
      throw new Error(assignment.assignmentType === "CLASS_MASTER"
        ? "Class already has an active Class Master"
        : "Class and subject already have an active Subject Teacher assignment");
    }
    await this.repository.save(assignment);
    return assignment;
  }

  async disable(assignmentId: string, permission: AssignmentPermission): Promise<TeachingAssignment> {
    if (!permission.canManage) throw new Error("Assignment management not permitted");
    const assignment = await this.repository.get(assignmentId);
    if (!assignment) throw new Error("Assignment not found");
    const updated = { ...assignment, status: "DISABLED" as const };
    await this.repository.save(updated);
    return updated;
  }

  async list(schoolId: string, permission: AssignmentPermission): Promise<TeachingAssignment[]> {
    if (!permission.canView) throw new Error("Assignment viewing not permitted");
    return this.repository.list(schoolId);
  }

  private validateAssignmentShape(assignment: TeachingAssignment): void {
    if (assignment.assignmentType === "CLASS_MASTER" && assignment.subjectId) throw new Error("Class Master assignment must not have a subject");
    if (assignment.assignmentType === "SUBJECT_TEACHER" && !assignment.subjectId) throw new Error("Subject Teacher assignment requires a subject");
    if (assignment.status !== "ACTIVE" && assignment.status !== "DISABLED") throw new Error("Invalid assignment status");
  }

  private validateReferences(assignment: TeachingAssignment, teacher: Teacher | undefined, schoolClass: SchoolClass | undefined, subject: Subject | undefined): void {
    if (!teacher) throw new Error("Teacher not found");
    if (!schoolClass) throw new Error("Class not found");
    if (assignment.assignmentType === "SUBJECT_TEACHER" && !subject) throw new Error("Subject not found");
    if (teacher.schoolId !== assignment.schoolId || schoolClass.schoolId !== assignment.schoolId || (subject && subject.schoolId !== assignment.schoolId)) {
      throw new Error("Assignment references must belong to the same school");
    }
    if (teacher.status !== "ACTIVE") throw new Error("Teacher is not active");
    if (subject && subject.status !== "ACTIVE") throw new Error("Subject is not active");
  }
}
