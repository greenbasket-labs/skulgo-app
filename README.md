# SkulGo Offline

Offline-first, node-based school records platform for schools that want their core records to work without an online database.

## Current status

SkulGo Offline is in **v1 stabilization and real-device testing**.

The approved v1 product surface is intentionally limited to:

- **Admin** — school administration and official records
- **Teacher** — teaching, attendance, and assigned student records

The core product is **fully offline**. Internet is not required for normal school operation.

**Current priority: test Admin + Teacher on phones, fix only confirmed defects, then secure data transfer and backup/restore.**

### Approved v1 academic flow

**School → Students/Classes/Subjects → Teacher Assignment → Attendance/CA/Exam → Results → Totals → Grade → Aggregate → Rank → Report Card → Publish → Print/Share**

The detailed release checklist is in `docs/release/v1-stabilization.md`.

## Product model

SkulGo supplies the school-record application and rules. The school owns and holds its records locally.

- Admin is the authoritative school records role.
- Teacher is a restricted working role.
- Admin and Teacher can operate independently without a live connection.
- Core records are stored locally on the device.
- SkulGo does not require a permanent cloud database for core use.
- Transport between devices is separate from the core record engine.

The product should behave correctly when there is **no internet at all**.

## Admin + Teacher

### Admin

Admin controls the official school records:

- School setup
- Students/admissions
- Classes
- Subjects
- Teachers
- Teaching assignments
- Attendance review
- Results
- Totals, grades, aggregates and ranks
- Report Cards
- Fees/Cashier foundations
- Official publishing
- Backup and restore

### Teacher

Teacher works only within assigned authority:

- Assigned classes
- Assigned subjects
- Students in assigned classes
- Attendance
- CA
- Exams
- Results
- Teacher-side submission/export

Teacher must not receive unrestricted Admin-private information.

## Data transfer

Admin and Teacher do **not** depend on a permanent connection.

When records need to move between devices, the package can be transported using whatever method the school chooses, for example:

- WhatsApp
- Gmail/email
- Bluetooth/Nearby Share
- USB
- SD card
- Local file transfer
- Internet/cloud storage when available

The transport method is not the school-record authority.

SkulGo validates the package before applying it.

### Frozen transfer identity envelope

Every supported transfer package is validated against:

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

**Student ID is the strongest student identity key.** A matching name is a supporting check.

Admin must reject mismatched authority, for example:

- unknown school
- inactive/unknown teacher
- wrong class
- wrong subject
- wrong session/term
- unauthorized record type

## Backup and restore

Backup is a core safety feature.

The intended flow is:

**Admin → Export School Backup → Store/send file → New Admin device → Import Backup → Validate → Restore**

A school may store the backup wherever it prefers. SkulGo does not require a hosted database for this.

Teacher submission follows the same principle:

**Teacher → Export Teacher Submission → Send manually → Admin → Import → Validate → Apply**

## Academic structure

The school structure is:

**School → Section → Class → Subject**

Academic records flow through:

**Attendance → CA → Exams → Results → Totals → Grade → Aggregate → Rank → Report Card → Publish**

Report Card is a consumer/assembly module. It consumes official records rather than becoming another results-entry system.

## Report Card v1

Report Card consumes:

- Student identity and class
- School/session/term information
- Attendance
- Exam/total/grade results
- Remarks
- Rank

CA is not printed as a separate report-card component in v1.

Average is normalized by the number of subjects actually offered:

**Average = Sum of valid subject totals ÷ Number of subjects offered**

This allows students offering different numbers of subjects to be ranked fairly.

## Synchronization boundary

The repository contains sync and pairing foundations, but **live device-to-device synchronization is not a requirement for the core v1 product**.

Future connected sync may be added as an optional transport/adapter. It must not become a dependency for offline operation.

## Inactive / later modules

These are intentionally outside the active v1 product surface:

- Parent workspace
- Student workspace
- School calendar
- Timetable
- Assignment/Homework
- Promotion
- Real device networking
- Advanced online sync
- Payment-provider integration

Do not add these simply because they are technically possible. Real school demand should drive later expansion.

## Repository structure

- `apps/admin/` — school authority application
- `apps/teacher/` — teacher working application
- `apps/cashier/`, `apps/parent/`, `apps/student/` — reserved/inactive
- `packages/identity/` — identity and device model
- `packages/school-records/` — common record contracts
- `packages/attendance/` — attendance
- `packages/results/` — CA/exams/results
- `packages/report-card/` — report-card assembly
- `packages/finance/` — fees/payments foundations
- `packages/messaging/` — messaging
- `packages/sync/` — optional synchronization foundation
- `database/local-schema/` — local storage foundation
- `docs/architecture/` — architecture contracts and decisions
- `docs/release/v1-stabilization.md` — release gates
- `ROADMAP.md` — implementation roadmap

## Development

From the repository root:

    npm install
    npm run check

Local Admin and Teacher development instructions are maintained with their respective apps.

The repository must pass typecheck and tests before a completed module is frozen.

## Installable offline web app

Admin and Teacher include an install manifest and service worker.

After the first successful load, the application shell can reopen without internet on supported browsers.

GitHub Pages publishes static copies for phone testing. Static hosting does **not** provide cross-device synchronization; each device keeps its own local records.

## Phone testing

Phone testing is currently focused on:

1. Open the single **SkulGo App** launcher.
2. Choose **Admin** or **Teacher**.
3. Confirm the selected role is remembered on that device.
4. Test the active workflows.
5. Report one confirmed bug at a time.
6. Fix the bug.
7. Re-test before freezing the module.

The phone test should not be treated as complete until both Admin and Teacher workflows survive refresh/restart and offline use.

## Future phone packaging

A native Android package may be added after the web/PWA v1 is stabilized.

The native package should wrap the proven offline application rather than create a second school-record implementation.

## Repository boundary

**Do not modify `greenbasket-labs/skulgo`.**

All Offline development happens only in:

`greenbasket-labs/skulgo-offline`

## Optional Report Card Revenue

Report Card Revenue is optional and school-controlled.

The current offline implementation stores configuration only. It does not treat browser/local data as proof of payment and does not collect or settle real money.

Secure payment collection, provider verification, webhooks, and settlement remain a separate future integration.
