# SkulGo Offline Roadmap

## Working rule

Build one module at a time:

**Propose → Review → Approve → Implement → Test/source-check → Freeze → Next module**

Keep v1 minimal. Do not add optional complexity until the core workflow is proven.

## Product boundary

### Active v1 apps

- [x] Admin
- [x] Teacher

### Inactive / later

- [ ] Cashier app
- [ ] Parent workspace
- [ ] Student workspace
- [ ] School calendar
- [ ] Timetable
- [ ] Assignment/Homework
- [ ] Promotion
- [ ] Real device networking
- [ ] Advanced online synchronization
- [ ] Payment-provider integration

## V1 stabilization — current phase

The core product is **offline-first and independent on each device**.

Current work is:

**Phone test → report confirmed defect → fix one defect → re-test → freeze**

### Core v1 modules

- [x] School setup
- [x] Students / admissions
- [x] Classes
- [x] Subjects
- [x] Teachers
- [x] Teaching Assignments
- [x] Attendance
- [x] CA
- [x] Exam
- [x] Results
- [x] Totals
- [x] Grade
- [x] Aggregate
- [x] Rank
- [x] Report Card
- [x] Report Card remarks
- [x] Report Card publishing
- [x] Report Card print/share
- [x] Optional Report Card Revenue configuration
- [x] Admin + Teacher installable offline web app
- [ ] Complete Admin phone acceptance test
- [ ] Complete Teacher phone acceptance test
- [ ] Offline refresh/restart acceptance on both apps
- [ ] Freeze confirmed v1 defects only

## Automated verification

Current repository test baseline:

- [x] Typecheck
- [x] Test suite
- [x] 108 tests passing at last verified baseline
- [ ] Re-run clean checkout verification before v1 freeze
- [ ] CI green on final stabilization commit

## Immediate next phase — secure data movement

After Admin + Teacher phone testing is stable:

### 1. School backup/restore

- [ ] Admin Export School Backup
- [ ] Validate backup package
- [ ] Admin Import Backup
- [ ] Restore school data safely
- [ ] Reject wrong/corrupt/incompatible backup
- [ ] Verify backup survives device replacement

### 2. Admin → Teacher class transfer

- [ ] Export assigned class package
- [ ] Include school/class/student identity
- [ ] Include assigned subject/teacher authority
- [ ] Teacher imports package
- [ ] Validate package before applying
- [ ] Support later student updates without blindly replacing the class
- [ ] Verify Teacher receives only authorized data

### 3. Teacher → Admin submission

- [ ] Export Teacher Submission
- [ ] Validate school/teacher/class/subject/session/term
- [ ] Reject unauthorized or mismatched records
- [ ] Admin reviews/imports valid records
- [ ] Preserve duplicate protection
- [ ] Preserve official Admin authority

## Frozen transfer identity envelope

Every supported package should validate:

- School ID
- Teacher ID
- Student ID
- Student name
- Class ID
- Subject ID
- Session
- Term
- Record type
- Record data

Rules:

- Student ID is the strongest identity key.
- Teacher ID identifies the sender.
- Wrong class must not be silently accepted.
- Wrong subject must be rejected.
- Wrong school/session/term must be rejected.
- Transport is not trusted; the package must be validated before apply.

## Synchronization — optional future adapter

Sync and pairing foundations may remain in the repository, but live device-to-device sync is **not a v1 dependency**.

Later, if real schools require it:

- [ ] Local network transport
- [ ] Internet transport
- [ ] Optional cloud transport
- [ ] Durable acknowledgements
- [ ] Duplicate/idempotency handling
- [ ] Conflict review
- [ ] Device authorization UI

Offline operation must continue to work if every transport is unavailable.

## Phone / Android release — after v1 freeze

- [ ] Choose Android wrapper/package approach
- [ ] Build installable Android package
- [ ] Verify local storage survives restart/update
- [ ] Verify no-internet operation
- [ ] Verify Admin and Teacher roles
- [ ] Verify update/migration safety
- [ ] Pilot with real schools
- [ ] Publish mobile release

## Later, only when real demand requires it

- [ ] Parent workspace
- [ ] Student workspace
- [ ] Calendar
- [ ] Timetable
- [ ] Homework/assignment workflow
- [ ] Promotion
- [ ] Secure payment provider
- [ ] Student-specific payment reference
- [ ] Payment webhook/server verification
- [ ] Automated revenue ledger / settlement
- [ ] Additional school workflows requested by pilot schools

## Repository boundary

SkulGo Offline is maintained separately from the existing online SkulGo repository.

**Do not modify `greenbasket-labs/skulgo`.**

All roadmap work applies only to:

`greenbasket-labs/skulgo-offline`
