# SkulGo Offline

Offline-first, node-based school records platform.

## Core model

SkulGo is a network of school-owned devices.

- Primary Admin node: authoritative school records.
- Trusted Admin nodes: additional phones, laptops, tablets, or other approved devices that replicate official records.
- Staff nodes: restricted working replicas for teachers, cashiers, and other roles.
- Parent/Student nodes: restricted views of explicitly permitted records.

The app installed on a device makes that device a node. The school does not need a permanent cloud database.

## Synchronization

Teacher work is saved locally first.

When a connection exists, authorized changes can synchronize live.

When there is no connection, changes remain queued and synchronize automatically later.

The sync engine uses durable acknowledgement, idempotency, versioning, permissions, and conflict detection.

Possible transports include internet, school Wi-Fi, hotspot/local network, nearby/Bluetooth, and QR/manual exchange.

## Academic flow

school -> classes/students/subjects -> teacher assignments -> attendance -> CA -> exams -> results -> report cards

Modules remain separate but communicate through stable IDs and structured records.

A report card consumes the same official CA, exam, attendance, student, subject, session, and term records already maintained by SkulGo.

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

- apps/ — role-specific applications
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

This repository is intentionally separate from the existing online SkulGo application.

## Authoritative Admin replication

The Admin node is the authoritative receiver for school-official records. Incoming changes are processed with three safety rules:

1. A change ID already recorded in the Admin inbox is treated as a duplicate and is not applied twice.
2. A record update is accepted only when its entity version is newer than the official version.
3. Stale/equal versions are recorded as conflicts and never overwrite the official record.

The SQLite reference implementation uses a transaction-capable database so the official record and inbox receipt can be committed together before the sender receives an acknowledgement.
