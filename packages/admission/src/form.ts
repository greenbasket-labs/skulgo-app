export interface AdmissionForm {
  studentFullName: string;
  admissionNumber?: string;
  classId: string;
}

export function validateAdmissionForm(form: AdmissionForm): string[] {
  const errors: string[] = [];
  if (!form.studentFullName.trim()) errors.push("Student full name is required");
  if (!form.classId.trim()) errors.push("Class is required");
  return errors;
}
