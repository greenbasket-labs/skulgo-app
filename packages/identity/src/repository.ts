export interface LocalSchool { schoolId:string; name:string; schoolType?:string; phone?:string; email?:string; address?:string; logoUrl?:string; createdAt:string; }
export interface LocalUser { userId:string; schoolId:string; role:string; displayName:string; status?:"ACTIVE"|"DISABLED"; createdAt:string; }
export interface LocalDevice { deviceId:string; schoolId:string; userId:string; nodeType:string; isTrusted:boolean; status?:"ACTIVE"|"DISABLED"; createdAt:string; lastSeenAt?:string; }
export interface LocalClass { classId:string; schoolId:string; name:string; createdAt:string; }
export interface LocalSubject { subjectId:string; schoolId:string; name:string; createdAt:string; }
export interface LocalStudent { studentId:string; schoolId:string; classId:string; admissionNumber?:string; displayName:string; gender?:"M"|"F"; createdAt:string; }
export type LocalAssignmentType = "CLASS_MASTER" | "SUBJECT_TEACHER";
export type LocalAssignmentStatus = "ACTIVE" | "DISABLED";
export interface LocalTeacherAssignment {
  assignmentId:string; schoolId:string; teacherUserId:string; classId:string;
  assignmentType:LocalAssignmentType; subjectId?:string; status:LocalAssignmentStatus; createdAt:string;
}
