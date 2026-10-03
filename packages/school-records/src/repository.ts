export interface LocalSchoolRecord {
  recordId: string;
  schoolId: string;
  recordType: string;
  createdByUserId: string;
  createdByDeviceId: string;
  sessionId?: string;
  termId?: string;
  classId?: string;
  subjectId?: string;
  studentId?: string;
  entityVersion: number;
  createdAt: string;
  updatedAt: string;
  payload: unknown;
  visibilityScope: string;
}

export interface LocalRecordStore {
  put(record: LocalSchoolRecord): Promise<void>;
  get(recordId: string): Promise<LocalSchoolRecord | undefined>;
  listByType(
    schoolId: string,
    recordType: string,
  ): Promise<LocalSchoolRecord[]>;
}
