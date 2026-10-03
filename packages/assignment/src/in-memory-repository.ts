import type { TeachingAssignment } from "./model";
import type { AssignmentRepository } from "./repository";

export class InMemoryAssignmentRepository implements AssignmentRepository {
  private readonly items = new Map<string, TeachingAssignment>();

  async save(assignment: TeachingAssignment): Promise<void> {
    this.items.set(assignment.assignmentId, assignment);
  }

  async get(assignmentId: string): Promise<TeachingAssignment | undefined> {
    return this.items.get(assignmentId);
  }

  async list(schoolId: string): Promise<TeachingAssignment[]> {
    return [...this.items.values()].filter((item) => item.schoolId === schoolId);
  }
}
