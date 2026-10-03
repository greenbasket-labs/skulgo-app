export interface SchoolProfile {
  schoolId: string;
  name: string;
  schoolType?: string;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
  createdAt: string;
}

export interface AcademicSession {
  sessionId: string;
  schoolId: string;
  name: string;
  createdAt: string;
  isCurrent?: boolean;
}

export interface AcademicTerm {
  termId: string;
  schoolId: string;
  sessionId: string;
  name: string;
  createdAt: string;
  isCurrent?: boolean;
}
