# SkulGo Offline v1 Stabilization

## Purpose

This phase freezes the approved v1 product surface and proves the offline-first Admin + Teacher application before broader packaging or feature expansion.

## v1 product boundary

Active apps:

- Admin
- Teacher

Core workflow:

**School → Students/Classes/Subjects → Teacher Assignment → Attendance/CA/Exam → Results → Totals → Grade → Aggregate → Rank → Report Card → Publish → Print/Share**

The core workflow must operate without an online database.

Intentionally inactive for v1:

- Cashier app
- Parent app
- Student app
- New feature modules not required to complete the core workflow

## Release gates

### Automated

- [x] Typecheck
- [x] Test suite — 108 tests passing at last verified baseline
- [ ] Clean checkout install verification
- [ ] Final CI run is green on the stabilization commit

### Admin phone acceptance

- [ ] Single SkulGo App launcher opens
- [ ] Admin role selection opens Admin
- [ ] Admin role is remembered after reopening
- [ ] School setup works
- [ ] Student admission works
- [ ] Classes/subjects/teachers/assignments work
- [ ] Attendance works
- [ ] Results work
- [ ] Report Card works
- [ ] Publish/print/share works
- [ ] Required data survives refresh/restart
- [ ] Core app works without internet

### Teacher phone acceptance

- [ ] Single SkulGo App launcher opens
- [ ] Teacher role selection opens Teacher
- [ ] Teacher role is remembered after reopening
- [ ] Teacher identity/local workspace works
- [ ] Assigned classes and subjects are enforced
- [ ] Class Master attendance works
- [ ] CA creation/editing works
- [ ] Exam creation/editing works
- [ ] Result totals and grades display correctly
- [ ] Unauthorized class/subject access is rejected
- [ ] Offline records remain available after refresh/restart

## Data movement — next approved module

Once phone acceptance is stable, implement secure file-based transfer rather than making live sync a v1 dependency.

### Admin backup

- [ ] Export complete school backup
- [ ] Validate package before restore
- [ ] Import backup on a new Admin device
- [ ] Preserve school identity and records
- [ ] Reject wrong/corrupt/incompatible packages

### Admin → Teacher

- [ ] Export assigned class package
- [ ] Validate school, teacher, class, student and subject authority
- [ ] Import on Teacher device
- [ ] Support later student update packages

### Teacher → Admin

- [ ] Export teacher submission
- [ ] Admin imports and validates
- [ ] Reject wrong school/class/subject/session/term
- [ ] Preserve duplicate/stale protections
- [ ] Apply only authorized records

## Frozen transfer identity envelope

Validate every transfer using:

**School ID + Teacher ID + Student ID + Student Name + Class ID + Subject ID + Session + Term + Record Type + Record Data**

Student ID is the strongest student identity key. Name is a supporting check.

## Report Card acceptance

- [ ] Report Card consumes official attendance/results records
- [ ] CA is not shown as a separate report-card component
- [ ] Average uses subjects actually offered
- [ ] Class rank uses normalized average
- [ ] School rank uses normalized average
- [ ] Attendance rate is correct
- [ ] Remarks work
- [ ] Publish status is enforced
- [ ] Print/share output is correct

## Sync boundary

Live device-to-device synchronization is **not a release gate for core v1**.

The sync/pairing packages may remain as foundations. Any future transport must be an adapter around the offline record model, not a requirement for local operation.

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
14. Repeat the critical flow on a phone with no internet.

## Freeze rule

After the above gates pass:

**Freeze v1.**

Only confirmed defects blocking the approved workflow may be fixed before the freeze. New feature requests move to the later roadmap.
