import type { AcademicSession, AcademicTerm, SchoolProfile } from "./domain";
import type { SchoolRepository } from "./repository";

export class InMemorySchoolRepository implements SchoolRepository {
  private readonly schools = new Map<string, SchoolProfile>();
  private readonly sessions = new Map<string, AcademicSession>();
  private readonly terms = new Map<string, AcademicTerm>();

  async getSchool(schoolId: string): Promise<SchoolProfile | undefined> {
    return this.schools.get(schoolId);
  }

  async saveSchool(school: SchoolProfile): Promise<void> {
    this.schools.set(school.schoolId, school);
  }

  async listSessions(schoolId: string): Promise<AcademicSession[]> {
    return [...this.sessions.values()].filter((item) => item.schoolId === schoolId);
  }

  async saveSession(session: AcademicSession): Promise<void> {
    this.sessions.set(session.sessionId, session);
  }

  async getCurrentSession(schoolId: string): Promise<AcademicSession | undefined> {
    return this.listSessions(schoolId).find((session) => session.isCurrent === true);
  }

  async listTerms(schoolId: string, sessionId: string): Promise<AcademicTerm[]> {
    return [...this.terms.values()].filter(
      (item) => item.schoolId === schoolId && item.sessionId === sessionId,
    );
  }

  async saveTerm(term: AcademicTerm): Promise<void> {
    this.terms.set(term.termId, term);
  }

  async getCurrentTerm(schoolId: string): Promise<AcademicTerm | undefined> {
    return [...this.terms.values()].find(
      (term) => term.schoolId === schoolId && term.isCurrent === true,
    );
  }
}
