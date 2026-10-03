export interface LocalSchool {
  schoolId: string;
  name: string;
  schoolType?: string;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
  createdAt: string;
}

export interface LocalUser {
  userId: string;
  schoolId: string;
  role: string;
  displayName: string;
  createdAt: string;
}

export interface LocalDevice {
  deviceId: string;
  schoolId: string;
  userId: string;
  nodeType: string;
  isTrusted: boolean;
  createdAt: string;
  lastSeenAt?: string;
}

export interface LocalClass {
  classId: string;
  schoolId: string;
  name: string;
  createdAt: string;
}

export interface LocalSubject {
  subjectId: string;
  schoolId: string;
  name: string;
  createdAt: string;
}

export interface LocalStudent {
  studentId: string;
  schoolId: string;
  classId: string;
  admissionNumber?: string;
  displayName: string;
  createdAt: string;
}

export interface LocalTeacherAssignment {
  assignmentId: string;
  schoolId: string;
  teacherUserId: string;
  classId: string;
  subjectId: string;
  createdAt: string;
}
