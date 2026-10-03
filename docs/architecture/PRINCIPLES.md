# Architecture Principles

## 1. Local first

Core school operations work without continuous internet. Each node has local storage for the data its role is authorized to use.

## 2. Admin is the school authority

A school may have one primary admin node and any number of additional trusted admin devices.

Trusted admin nodes replicate the official school state.

## 3. Staff are restricted working nodes

Teachers and cashiers do not receive unrestricted school data. They receive only the classes, subjects, students, and records required for their assignments.

## 4. Live when connected, delayed when offline

A teacher can record work without a network. When a connection becomes available, SkulGo automatically synchronizes queued changes.

## 5. Durable acknowledgement

A record is considered safely delivered only after the receiving trusted node durably stores it and acknowledges the change.

## 6. Replicate records, never database access

Nodes exchange structured changes. A device never receives another device's unrestricted database.

## 7. Directional privacy

Admin can see authorized staff activity, while admin-private information remains private. Staff do not automatically receive the admin's entire activity or school database.

## 8. One teacher per class + subject

The initial academic assignment rule is unique per school, class, and subject. This removes ambiguity when a teacher records attendance or scores.

## 9. Stable identity

Core records use stable IDs: school_id, user_id, device_id, class_id, subject_id, student_id, session_id, term_id, record_id, and change_id.

## 10. Modules communicate through contracts

Attendance, results, finance, messaging, and report cards remain separate modules but share stable identifiers and structured records.

## 11. Report cards are downstream, not isolated

Report cards consume the official records produced by attendance and results plus school configuration. The same data should not be entered again just to produce a report card.

## 12. Backup is optional but durable

Backups can be scheduled weekly, monthly, or by term. Backup storage is separate from live school synchronization and may use local storage or a provider such as Google Drive.
