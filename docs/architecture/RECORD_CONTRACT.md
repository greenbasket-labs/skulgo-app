# Record Contract

Every transferable school record should carry a common envelope.

## Required identity

- record_id: globally unique record identifier
- school_id: owning school
- user_id: submitting/creating user
- record_type: attendance, result, payment, message, etc.
- created_at: creation timestamp

## Academic context when applicable

- session_id
- term_id
- class_id
- subject_id

Not every record needs every academic field. For example, a school-level announcement may not have class_id or subject_id.

## Lifecycle

created
-> pending
-> sent
-> received
-> accepted

Rejected records should retain the rejection reason.

## Example

```json
{
  "record_id": "ATT_01J...",
  "school_id": "SCH_GBG",
  "user_id": "USR_T004",
  "record_type": "attendance",
  "session_id": "SES_2026_2027",
  "term_id": "TERM_1",
  "class_id": "CLS_SS3",
  "subject_id": "SUB_MATH",
  "created_at": "2026-10-03T00:00:00Z",
  "status": "pending",
  "payload": {}
}
```
