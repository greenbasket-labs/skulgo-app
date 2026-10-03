import assert from "node:assert/strict";
import test from "node:test";
import { createAdmissionFromForm } from "../packages/admission/src/application";

test("simple admission form creates a pending admission", () => {
  const admission = createAdmissionFromForm(
    {
      studentFullName: "Musa Abdullahi",
      admissionNumber: "",
      classId: "ss1",
    },
    "school-1",
    "adm-1",
    "staff-1",
    "2026-10-03T08:30:00.000Z",
  );

  assert.equal(admission.applicantName, "Musa Abdullahi");
  assert.equal(admission.intendedClassId, "ss1");
  assert.equal(admission.status, "PENDING");
});

test("simple admission form requires name and class", () => {
  assert.throws(
    () =>
      createAdmissionFromForm(
        { studentFullName: "", classId: "" },
        "school-1",
        "adm-1",
        "staff-1",
        "2026-10-03T08:30:00.000Z",
      ),
    /Student full name is required; Class is required/,
  );
});
