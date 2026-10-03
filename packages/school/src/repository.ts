import type { AcademicSession, AcademicTerm, SchoolProfile } from "./domain";

export interface SchoolRepository {
  getSchool(schoolId: string): Promise<SchoolProfile | undefined>;
  saveSchool(school: SchoolProfile): Promise<void>;
  listSessions(schoolId: string): Promise<AcademicSession[]>;
  saveSession(session: AcademicSession): Promise<void>;
  getCurrentSession(schoolId: string): Promise<AcademicSession | undefined>;
  listTerms(schoolId: string, sessionId: string): Promise<AcademicTerm[]>;
  saveTerm(term: AcademicTerm): Promise<void>;
  getCurrentTerm(schoolId: string): Promise<AcademicTerm | undefined>;
}
