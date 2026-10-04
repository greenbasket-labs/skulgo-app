# SkulGo Offline Roadmap

## Working rule

Build one module at a time:

**Propose → Review → Approve → Implement → Test/source-check → Freeze → Next module**

Keep v1 minimal. Do not add optional complexity until the core workflow is proven.

## V1 stabilization — current phase

The approved v1 feature surface is now in stabilization. Feature expansion is paused until the release gates are passed.

### Active v1 apps

- [x] Admin
- [x] Teacher
- [ ] Cashier app — inactive
- [ ] Parent app — inactive
- [ ] Student app — inactive

### Core v1 workflow

- [x] School setup
- [x] Students / admissions
- [x] Classes
- [x] Subjects
- [x] Teachers
- [x] Teaching Assignments
- [x] Attendance
- [x] CA
- [x] Exam
- [x] Results foundation
- [x] Totals
- [x] Grade
- [x] Aggregate
- [x] Rank foundation
- [x] Report Card review
- [x] Report Card remarks
- [x] Report Card publishing
- [x] Report Card print/share
- [x] Optional Report Card Revenue configuration
- [ ] End-to-end Teacher → Sync → Admin → Report Card verification
- [x] Installable offline web app shell for Admin + Teacher

### Stabilization gates

- [x] Add clean-checkout CI workflow
- [ ] npm install on clean checkout
- [ ] npm run typecheck
- [ ] npm test
- [ ] Manual Admin acceptance test
- [ ] Manual Teacher acceptance test
- [ ] Offline/restart persistence test
- [ ] End-to-end sync acceptance test
- [ ] Report Card calculation/rank acceptance test
- [ ] Publish/print/share acceptance test
- [ ] Remove only confirmed v1 defects
- [ ] Freeze v1

See docs/release/v1-stabilization.md for the release checklist.

## Phone release — after v1 freeze

- [ ] Choose the phone wrapper/package approach
- [ ] Add installable Android build
- [ ] Verify local storage survives app restart/update
- [ ] Verify offline operation with no internet
- [ ] Verify Admin and Teacher device roles
- [ ] Verify update/migration safety
- [ ] Pilot with real schools
- [ ] Publish v1 mobile release

The phone package should wrap the stabilized application rather than create a second school-record implementation.

## Later, only when real demand requires it

- [ ] Secure payment provider
- [ ] Student-specific payment request/reference
- [ ] Provider webhook/server verification
- [ ] Automated 50/50 settlement and revenue ledger
- [ ] Parent workspace
- [ ] Student workspace
- [ ] Promotion
- [ ] School calendar
- [ ] Timetable
- [ ] Advanced device pairing UI
- [ ] Local network synchronization UI
- [ ] Backup/restore UI
- [ ] Offline conflict review
- [ ] Additional school workflows requested by pilot schools

## Repository boundary

SkulGo Offline is maintained separately from the existing online SkulGo repository. Work in this roadmap applies only to greenbasket-labs/skulgo-offline.
