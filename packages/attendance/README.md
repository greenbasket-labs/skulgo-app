# Attendance Module

Attendance is a domain module, not a synchronization implementation.

## Input

- school_id
- class_id
- student_id
- session_id
- term_id
- attendance date
- teacher_user_id
- device_id
- attendance status

## Rules

The teacher may record attendance only for an assigned class.

The assignment is identified by school_id + class_id + subject_id. Where attendance is not subject-specific, the teacher's class assignment authorizes the action.

## Output

Attendance produces structured records that enter the local sync outbox.

The admin node can receive those records live or later.

## Weekly behavior

A teacher may record an entire week offline. When connected, the sync engine delivers the unsynchronized changes and the admin view becomes current without manual resubmission.

Attendance is also available to downstream modules such as reports and report cards where the school's configuration requires it.
