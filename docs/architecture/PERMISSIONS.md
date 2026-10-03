# Permission and Visibility Model

Permissions are scoped by school and assignment.

## Teacher scope

A teacher receives only:

- assigned classes
- assigned subjects
- students belonging to those assigned classes
- records the teacher is allowed to create/update for those assignments
- the teacher's own work/history

The initial assignment rule is strict:

One teacher per class + subject assignment.

An assignment is identified by:

- school_id
- class_id
- subject_id
- teacher_user_id

## Admin scope

Authorized admin nodes can access the school's official records according to school policy.

Admin-private records are not replicated to teachers, cashiers, parents, or students unless explicitly exposed by a module.

## Directional visibility

Replication is directional in terms of authorization.

Teacher -> Admin may carry attendance, CA, exam scores, and other permitted teacher work.

Admin -> Teacher carries only the records needed for the teacher's assigned work.

A teacher cannot infer or query unrelated school records merely because their device is connected to an admin node.

## No database sharing

A node never receives unrestricted database access from another node.

Every replicated change passes authorization checks.
