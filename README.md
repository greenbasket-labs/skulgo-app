# SkulGo Offline

Offline-first, node-based school records platform.

## Current status

SkulGo Offline is in **v1 stabilization**. The approved v1 product surface is intentionally limited to **Admin + Teacher** while the core offline workflow is tested and frozen.

**Current priority: stabilize first, package for phones second, add new features later from real school demand.**

Core v1 flow:

**School → Students/Classes/Subjects → Teacher Assignment → Attendance/CA/Exam → Results → Report Card → Publish → Print/Share**

The release checklist is in docs/release/v1-stabilization.md.

## Core model

SkulGo is a network of school-owned devices.

- Primary Admin node: authoritative school records.
- Trusted Admin nodes: additional phones, laptops, tablets, or other approved devices that replicate official records.
- Teacher nodes: restricted working replicas for assigned teaching duties.
- Cashier, Parent, and Student apps are intentionally inactive in v1.

The app installed on a device makes that device a node. The school does not need a permanent cloud database.

## Academic structure

The school structure is:

**School → Section → Class → Subject**

Students belong to classes. Teachers and teacher assignments connect staff to academic work. Academic records flow through:

**Attendance → CA → Exams → Results → Totals → Grade → Aggregate → Rank → Report Card → Publish**

## Synchronization

Teacher work is saved locally first.

Pairing/trust is intended to be durable, while a network connection is temporary. A device can disconnect without losing its local records.

Teacher work is saved locally first. The shared sync engine provides the queue, acknowledgement, idempotency, versioning, permissions, and conflict-detection foundation.

**Important v1 boundary:** real phone/laptop device-to-device synchronization is not yet wired into the Admin and Teacher application screens. A local copy must never be treated as proof that a record reached Admin until Sync acknowledges it.

Possible transports include internet, school Wi-Fi, hotspot/local network, nearby/Bluetooth, and QR/manual exchange.

## Teacher assignment rule

Initially, a school may assign only one teacher to a given class + subject combination.

A teacher receives only:

- assigned classes
- assigned subjects
- students belonging to those classes
- authorized attendance/results work
- their own relevant history

## Privacy

Admin-private information is not automatically replicated to staff.

Nodes exchange authorized record changes, not unrestricted database access.

## Storage and backup

The initial design uses local SQLite-style storage.

Live school data stays on school-owned nodes.

Optional backups can later be scheduled weekly, monthly, or per term and stored locally or with an external storage provider.

## Repository structure

- apps/admin/ — school authority application
- apps/teacher/ — teacher working application
- apps/cashier/, apps/parent/, apps/student/ — reserved/inactive until later demand
- packages/identity/ — identity and device model
- packages/school-records/ — common record contracts
- packages/attendance/ — attendance
- packages/results/ — CA/exams/results
- packages/report-card/ — connected report cards
- packages/finance/ — fees/payments
- packages/messaging/ — messaging
- packages/sync/ — node replication
- database/local-schema/ — local storage foundation
- docs/architecture/ — system contracts and decisions
- docs/release/v1-stabilization.md — release gates
- ROADMAP.md — implementation roadmap

## Development

From the repository root:

    npm install
    npm run dev

Admin runs locally at http://localhost:3000.

Teacher runs locally with:

    node apps/teacher/server.mjs

Typecheck and tests:

    npm run check

A GitHub Actions workflow now runs the clean-install, typecheck, and test gates on pushes and pull requests to main.

## Installable offline web app

Admin and Teacher now include an install manifest and service worker. After the first successful load, the application shell can reopen without internet on supported browsers.

A GitHub Pages workflow publishes static installable copies of both apps. Static mode uses local browser storage; it does not provide cross-device sync.

## Phone release

A native phone package remains deliberately **after v1 stabilization**. The mobile release will wrap the stabilized offline application instead of creating a separate school-record implementation.

## Repository boundary

Do not modify the existing online SkulGo repository as part of this project. SkulGo Offline is developed independently so its offline-first architecture and contracts can evolve without coupling to the online application.

## Optional Report Card Revenue

Report Card Revenue is an optional school-level module. A school may enable a fee for official report-card publishing and configure the amount in NGN. The intended commercial split is **50% school / 50% SkulGo**, before payment-provider processing charges.

The current offline implementation stores only the school's configuration. It does **not** treat browser/local data as proof of payment and does not collect or settle real money. Secure payment collection, verification, webhooks, and 50/50 settlement will be implemented as a separate payment integration.
