import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryAssignmentRepository } from "../packages/assignment/src/in-memory-repository";
import { AssignmentService } from "../packages/assignment/src/service";
import { InMemoryTeacherRepository } from "../packages/teacher/src/in-memory-repository";
import { InMemoryClassRepository } from "../packages/class/src/in-memory-repository";
import { InMemorySubjectRepository } from "../packages/subject/src/in-memory-repository";

const permission = { canManage: true, canView: true };

test("authorized user can create, list, and disable a teaching assignment", async () => {
  const teachers = new InMemoryTeacherRepository();
  const classes = new InMemoryClassRepository();
  const subjects = new InMemorySubjectRepository();
  const assignments = new InMemoryAssignmentRepository();

  await teachers.save({
    teacherId: "teacher-1",
    schoolId: "school-1",
    fullName: "Aisha Bello",
    status: "ACTIVE",
    createdAt: "2026-10-03T08:00:00.000Z",
  });
  await classes.save({
    classId: "class-1",
    schoolId: "school-1",
    name: "SS 1",
    createdAt: "2026-10-03T08:00:00.000Z",
  });
  await subjects.save({
    subjectId: "subject-1",
    schoolId: "school-1",
    name: "Mathematics",
    status: "ACTIVE",
    createdAt: "2026-10-03T08:00:00.000Z",
  });

  const service = new AssignmentService(assignments, teachers, classes, subjects);

  const created = await service.create({
    assignmentId: "assignment-1",
    schoolId: "school-1",
    teacherId: "teacher-1",
    classId: "class-1",
    subjectId: "subject-1",
    status: "ACTIVE",
    createdAt: "2026-10-03T08:00:00.000Z",
  }, permission);

  assert.equal(created.teacherId, "teacher-1");
  assert.equal(created.classId, "class-1");
  assert.equal(created.subjectId, "subject-1");

  assert.equal((await service.list("school-1", permission)).length, 1);

  const disabled = await service.disable("assignment-1", permission);
  assert.equal(disabled.status, "DISABLED");
});

test("assignment rejects missing references", async () => {
  const service = new AssignmentService(
    new InMemoryAssignmentRepository(),
    new InMemoryTeacherRepository(),
    new InMemoryClassRepository(),
    new InMemorySubjectRepository(),
  );

  await assert.rejects(
    () => service.create({
      assignmentId: "assignment-1",
      schoolId: "school-1",
      teacherId: "missing",
      classId: "missing",
      subjectId: "missing",
      status: "ACTIVE",
      createdAt: "2026-10-03T08:00:00.000Z",
    }, permission),
    /Teacher not found/,
  );
});

test("assignment rejects cross-school references and inactive records", async () => {
  const teachers = new InMemoryTeacherRepository();
  const classes = new InMemoryClassRepository();
  const subjects = new InMemorySubjectRepository();

  await teachers.save({
    teacherId: "teacher-1",
    schoolId: "school-2",
    fullName: "Aisha Bello",
    status: "ACTIVE",
    createdAt: "2026-10-03T08:00:00.000Z",
  });
  await classes.save({
    classId: "class-1",
    schoolId: "school-1",
    name: "SS 1",
    createdAt: "2026-10-03T08:00:00.000Z",
  });
  await subjects.save({
    subjectId: "subject-1",
    schoolId: "school-1",
    name: "Mathematics",
    status: "DISABLED",
    createdAt: "2026-10-03T08:00:00.000Z",
  });

  const service = new AssignmentService(
    new InMemoryAssignmentRepository(),
    teachers,
    classes,
    subjects,
  );

  await assert.rejects(
    () => service.create({
      assignmentId: "assignment-1",
      schoolId: "school-1",
      teacherId: "teacher-1",
      classId: "class-1",
      subjectId: "subject-1",
      status: "ACTIVE",
      createdAt: "2026-10-03T08:00:00.000Z",
    }, permission),
    /same school/,
  );
});
