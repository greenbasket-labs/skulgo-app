# SkulGo Offline Roadmap

## Working rule

Build one module at a time:

**Propose → Review → Approve → Implement → Test/source-check → Freeze → Next module**

Keep v1 minimal. Do not add optional complexity until the core workflow is proven.

## Completed / frozen domain foundation

- [x] School v1 — school profile, academic session, current term, multiple school sections
- [x] School structure v1 — School → Section → Class → Subject
- [x] Admission / Student v1 — admissions, approval, stable admission numbers, class membership
- [x] Class v1
- [x] Subject v1
- [x] Teacher v1
- [x] Teacher Assignment v1
- [x] Attendance v1
- [x] CA v1
- [x] Exam v1
- [x] Results v1
- [x] Totals v1
- [x] Grade v1
- [x] Aggregate v1
- [x] Rank v1
- [x] Report Card v1 domain
- [x] Fees v1 domain
- [x] Cashier / Payment Verification v1 domain
- [x] Messaging v1 domain
- [x] Sync v1 domain
- [x] Sync Transport v1 domain
- [x] Backup v1 domain
- [x] Identity & Roles v1 domain
- [x] Device Pairing v1 domain
- [x] Connection Status v1 domain
- [x] Local Network Connection v1 domain
- [x] Result Publishing v1 domain

## Admin UI progress

### Completed

- [x] Admin shell and local workspace
- [x] School Setup
- [x] Students / admissions
- [x] Classes
- [x] Subjects
- [x] Teachers
- [x] Attendance
- [x] Results review
- [x] Report Card review screen
- [x] Local student persistence through the Admin Node runtime store

### Current module

**Report Card review v1**

Purpose:
- Select a class
- Select a student
- Review subject totals
- Review grades
- Review overall total
- Review average
- Review class position
- Review attendance

Important v1 note: the current Admin Report Card screen is a review UI. It currently performs some result/grade/rank calculations in the Admin client rather than directly instantiating every domain service. This should be aligned carefully before treating the Admin screen as the final publication pipeline.

## Next Admin modules

### 1. Report Card hardening and freeze

- [ ] User-test Report Card with existing Primary 1 students
- [ ] Verify no-result and missing-grade-scale states
- [ ] Verify attendance display
- [ ] Verify class position and tie behavior
- [ ] Align calculations with Aggregate, Grade, Rank, and Report Card domain contracts
- [ ] Freeze Report Card review v1

### 2. Result Publishing

- [ ] Add Admin publishing screen
- [ ] Publish/unpublish result for the intended academic period
- [ ] Show publication status
- [ ] Keep publishing separate from editing results
- [ ] Freeze Result Publishing UI v1

### 3. Print / Share output

- [ ] Add a minimal printable published report card
- [ ] Use published result data rather than a second result calculation path
- [ ] Leave external sending/integration options for a later phase

### 4. Fees

- [ ] Implement minimal Admin fee setup UI
- [ ] School/class/student fee records
- [ ] Keep payment verification separate from fee definition

### 5. Cashier

- [ ] Implement payment verification workflow
- [ ] Verify student/admission identity
- [ ] Record verified payment
- [ ] Update balance
- [ ] Keep online payment integrations optional and separate

### 6. Messaging

- [ ] Implement minimal school-to-user messaging workflow
- [ ] Respect role and record permissions
- [ ] Keep delivery transport separate from message records

## Later platform work

- [ ] Teacher workspace UI
- [ ] Staff restricted replicas
- [ ] Parent/Student restricted views
- [ ] Device pairing UI
- [ ] Local network synchronization UI
- [ ] Sync queue and acknowledgement UI
- [ ] Backup/restore UI
- [ ] Offline conflict review

## Release discipline

Before freezing a module:

1. Test the actual Admin workflow locally.
2. Verify data persists after refresh/restart where persistence is required.
3. Check source against the approved module scope.
4. Run typecheck/tests where applicable.
5. Commit the module separately.
6. Do not start the next module until the current module is accepted.

## Repository boundary

SkulGo Offline is maintained separately from the existing online SkulGo repository. Work in this roadmap applies only to greenbasket-labs/skulgo-offline.