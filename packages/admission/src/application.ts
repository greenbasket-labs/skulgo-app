import type { Admission } from "./model";
import type { AdmissionForm } from "./form";
import { validateAdmissionForm } from "./form";

export function createAdmissionFromForm(
  form: AdmissionForm,
  schoolId: string,
  admissionId: string,
  createdByUserId: string,
  now: string,
): Admission {
  const errors = validateAdmissionForm(form);
  if (errors.length) throw new Error(errors.join("; "));

  return {
    admissionId,
    schoolId,
    applicantName: form.studentFullName.trim(),
    intendedClassId: form.classId,
    admissionNumber: form.admissionNumber?.trim() || undefined,
    status: "PENDING",
    createdByUserId,
    createdAt: now,
    updatedAt: now,
  };
}
