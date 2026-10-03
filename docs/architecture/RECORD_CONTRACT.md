# Record Contract

Every transferable school record carries a common envelope.

## Identity

- record_id
- school_id
- user_id
- device_id
- record_type
- created_at
- updated_at
- entity_version

## Academic context when applicable

- session_id
- term_id
- class_id
- subject_id
- student_id

## Visibility

Each record declares its allowed visibility/scope.

Examples:

- admin_private
- school_official
- teacher_assignment
- cashier_assignment
- parent_visible
- student_visible

Visibility is enforced before replication.

## Change envelope

A synchronized change additionally contains:

- change_id
- record_id
- school_id
- actor_user_id
- actor_device_id
- entity_version
- created_at
- payload
- target/scope

## Delivery

The sender keeps the change until the receiver acknowledges durable storage.

Flow:

created -> local_saved -> queued -> sent -> received -> acknowledged

A failed transfer stays queued.

## Duplicate safety

change_id is idempotent. Receiving the same change twice must not create duplicate records.

## Conflict safety

Concurrent changes to the same logical record must not silently overwrite one another. Conflicts retain both versions and can be resolved according to school policy.

## Example

    {
      "change_id": "CHG_01J...",
      "record_id": "ATT_01J...",
      "school_id": "SCH_001",
      "user_id": "USR_T004",
      "device_id": "DEV_T004",
      "record_type": "attendance",
      "session_id": "SES_2026_2027",
      "term_id": "TERM_1",
      "class_id": "CLS_SS1",
      "subject_id": "SUB_MATH",
      "student_id": "STU_001",
      "entity_version": 1,
      "created_at": "2026-10-03T00:00:00Z",
      "payload": {
        "date": "2026-10-03",
        "status": "present"
      },
      "visibility": "school_official"
    }
