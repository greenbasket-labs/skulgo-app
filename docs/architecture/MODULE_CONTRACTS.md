# Module Contracts

## Purpose
SkulGo is a modular school operating system. Each school module owns one business capability and can be rebuilt, upgraded, replaced, or enabled independently.

## Core rule
A school does **not** have to enable every module at once. A school may start with only the modules it needs and enable additional modules later.

## Module ownership
- School: school identity and configuration
- Admission: applicants and admission lifecycle
- Student: student identity/profile
- Class: class identity and membership
- Subject: subject identity/configuration
- Teacher: teacher identity and assignments
- Attendance: attendance records
- CA: continuous assessment records
- Exam: examination records
- Results: computed/official subject results
- Report Card: report-card generation
- Fees: fee definitions and balances
- Payments: payment records
- Cashier: cashier workflows and receipts
- Messaging: school communication
- Identity: users, devices and roles
- Sync: replication and delivery
- Backup: backup and restore

## Contract rule
A module may consume another module's public contract, but must not depend on its private implementation or tables. Stable IDs and contracts are the boundary between modules.

## Module lifecycle
Modules are school-scoped and can be available, enabled, disabled, or deprecated.

## Dependencies
Dependencies are explicit. Enabling a module does not mean enabling every SkulGo module. Required dependencies must be available/configured for that capability.

## Upgrade rule
A module implementation may be replaced while its public contract remains compatible. For example, Teacher v2 can become Teacher v3 without rewriting Attendance, CA, or Exam.

## Offline rule
Module records are locally persisted on the node. Sync transports authorized record changes. Domain modules do not implement their own transport protocol.

## Example configurations
- Small school: School + Identity + Student + Class + Teacher + Attendance
- Academic school: add Subject + CA + Exam + Results + Report Card
- Finance school: add Fees + Payments + Cashier
- Later: enable Messaging, Backup, or other capabilities without rebuilding existing modules