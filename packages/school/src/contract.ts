import type { AcademicSession, AcademicTerm, SchoolProfile } from "./domain";

export interface SchoolContract {
  getSchool(schoolId: string): Promise<SchoolProfile | undefined>;
  getCurrentSession(schoolId: string): Promise<AcademicSession | undefined>;
  getCurrentTerm(schoolId: string): Promise<AcademicTerm | undefined>;
  getAcademicSessions(schoolId: string): Promise<AcademicSession[]>;
}
