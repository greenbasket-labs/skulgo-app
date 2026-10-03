export type IdentityRole = "ADMIN" | "TEACHER" | "CASHIER" | "PARENT" | "STUDENT";
export type IdentityStatus = "ACTIVE" | "DISABLED";

export interface IdentityUser {
  userId: string;
  schoolId: string;
  displayName: string;
  role: IdentityRole;
  status: IdentityStatus;
  createdAt: string;
}

export interface IdentityDevice {
  deviceId: string;
  schoolId: string;
  userId: string;
  nodeType: "primary_admin" | "trusted_admin" | "staff" | "parent" | "student";
  isTrusted: boolean;
  status: IdentityStatus;
  createdAt: string;
  lastSeenAt?: string;
}

export interface AccessRequest {
  schoolId: string;
  userId: string;
  moduleId: string;
  action: string;
  resource?: {
    teacherUserId?: string;
    visibility?: "admin_private" | "school_official" | "teacher_assignment" | "cashier_assignment" | "parent_visible" | "student_visible";
  };
}
