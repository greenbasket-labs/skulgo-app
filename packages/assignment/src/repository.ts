import type { TeachingAssignment } from "./model";

export interface AssignmentRepository {
  save(assignment: TeachingAssignment): Promise<void>;
  get(assignmentId: string): Promise<TeachingAssignment | undefined>;
  list(schoolId: string): Promise<TeachingAssignment[]>;
}
