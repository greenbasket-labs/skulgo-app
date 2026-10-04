# SkulGo Offline v1 Stabilization

## Purpose

This phase freezes the approved v1 product surface and proves the existing offline-first core before phone packaging.

## v1 product boundary

Active apps:

- Admin
- Teacher

Core workflow:

**School → Students/Classes/Subjects → Teacher Assignment → Attendance/CA/Exam → Results → Report Card → Publish → Print/Share**

Intentionally inactive for v1:

- Cashier app
- Parent app
- Student app
- New feature modules not required to complete the core workflow

## Release gates

### Automated

- [ ] npm ci succeeds from a clean checkout
- [ ] npm run typecheck passes
- [ ] npm test passes
- [ ] GitHub Actions CI is green on main

### Admin

- [ ] Fresh school setup works
- [ ] Student data persists after restart
- [ ] Class/subject/teacher/assignment workflow works
- [ ] Class Master attendance works
- [ ] Results review works
- [ ] Report Card consumes official records
- [ ] Average uses subjects actually offered
- [ ] Class rank and school rank are correct
- [ ] Attendance summary is correct
- [ ] Remarks can use defaults and custom values
- [ ] Publish makes the report official
- [ ] Published reports can be printed/shared
- [ ] Batch print includes only published reports
- [ ] Paid Report Card setting remains configuration-only until secure payment integration exists

### Teacher

- [ ] Teacher identity/local workspace works
- [ ] Assigned classes and subjects are enforced
- [ ] Class Master attendance works
- [ ] CA creation/editing works
- [ ] Exam creation/editing works
- [ ] Result totals and grades display correctly
- [ ] Unauthorized class/subject access is rejected
- [ ] Offline records remain available after refresh/restart

### Sync

- [ ] Teacher changes remain queued while offline
- [ ] Authorized changes reach Admin when connected
- [ ] Duplicate delivery is idempotent
- [ ] Stale/conflicting versions do not overwrite official data
- [ ] Acknowledgement clears the sender queue only after successful delivery

## Manual school acceptance

Use a small realistic school dataset and complete one full term:

1. Configure school/session/term.
2. Create one class and subjects.
3. Create teachers and assignments.
4. Add at least two students.
5. Record attendance.
6. Enter CA and Exam scores.
7. Produce Results.
8. Review Report Card.
9. Check average, subjects offered, class rank, school rank and attendance.
10. Add remarks.
11. Publish.
12. Print one report, print the class, and share one report.
13. Restart the local apps and confirm required data remains available.

## Phone packaging comes after this gate

Do not introduce phone packaging, payment providers, parent/student apps, or major new UI while these gates are open.

The phone release should wrap the stabilized application rather than create a second implementation of school records.
