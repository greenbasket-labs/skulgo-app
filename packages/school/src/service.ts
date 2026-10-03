import type { SchoolContract } from "./contract";
import type { AcademicSession, AcademicTerm, SchoolProfile } from "./domain";
import type { SchoolRepository } from "./repository";

export class SchoolService implements SchoolContract {
  constructor(private readonly repository: SchoolRepository) {}

  getSchool(schoolId: string): Promise<SchoolProfile | undefined> {
    return this.repository.getSchool(schoolId);
  }

  getCurrentSession(schoolId: string): Promise<AcademicSession | undefined> {
    return this.repository.getCurrentSession(schoolId);
  }

  getCurrentTerm(schoolId: string): Promise<AcademicTerm | undefined> {
    return this.repository.getCurrentTerm(schoolId);
  }

  getAcademicSessions(schoolId: string): Promise<AcademicSession[]> {
    return this.repository.listSessions(schoolId);
  }
}
