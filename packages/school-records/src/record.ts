export type NodeType =
  | "primary_admin"
  | "trusted_admin"
  | "staff"
  | "parent"
  | "student";

export type RecordVisibility =
  | "admin_private"
  | "school_official"
  | "teacher_assignment"
  | "cashier_assignment"
  | "parent_visible"
  | "student_visible";

export type RecordType =
  | "attendance"
  | "ca"
  | "exam"
  | "subject_result"
  | "student"
  | "payment"
  | "message"
  | "report_card";

export interface RecordIdentity {
  recordId: string;
  schoolId: string;
  userId: string;
  deviceId: string;
  recordType: RecordType;
  createdAt: string;
  updatedAt: string;
  entityVersion: number;
  sessionId?: string;
  termId?: string;
  classId?: string;
  subjectId?: string;
  studentId?: string;
}

export interface SchoolRecord<TPayload = unknown> extends RecordIdentity {
  visibility: RecordVisibility;
  payload: TPayload;
}

export interface RecordChange<TPayload = unknown> {
  changeId: string;
  record: SchoolRecord<TPayload>;
  actorUserId: string;
  actorDeviceId: string;
  createdAt: string;
}
