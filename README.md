# SkulGo Offline

Offline-first school records platform.

## Principles

- Local-first: core school operations work without continuous internet.
- Modular: each domain has one responsibility.
- Record-oriented: users exchange structured records, not database access.
- School-owned records: every record is scoped to a school.
- Sync-ready: transport can be added without changing business modules.

## Identity

Core records use stable identifiers:

- school_id
- user_id
- class_id
- subject_id
- session_id
- term_id
- record_id

## Planned apps

- admin
- teacher
- cashier
- parent
- student

## Planned packages

- identity
- school-records
- attendance
- results
- finance
- messaging
- sync

This repository is intentionally separate from the existing online SkulGo application.
