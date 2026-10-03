export type ResultPublicationStatus = "PUBLISHED" | "UNPUBLISHED";

export interface ResultPublication {
  publicationId: string;
  schoolId: string;
  studentId: string;
  classId: string;
  sessionId: string;
  termId: string;
  status: ResultPublicationStatus;
  publishedAt?: string;
  publishedByUserId?: string;
  updatedAt: string;
}
