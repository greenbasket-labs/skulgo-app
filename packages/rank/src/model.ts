export interface RankEntry {
  studentId: string;
  subjectsOffered: number;
  overallTotal?: number;
  average?: number;
  position?: number;
}

export interface RankResult {
  rankId: string;
  schoolId: string;
  classId: string;
  sessionId: string;
  termId: string;
  entries: RankEntry[];
}
