# Replication Protocol

Replication is the core behavior of SkulGo Offline.

## Change unit

A domain module creates a deterministic change containing:

- change_id
- record_id
- school_id
- actor_user_id
- actor_device_id
- record_type
- entity_version
- created_at
- payload
- visibility/scope
- sync_state

## Delivery

The sender keeps an outbox entry until the receiver acknowledges durable storage.

Flow:

created -> local_saved -> queued -> sending -> delivered -> acknowledged

A failed connection returns the change to queued.

## Idempotency

The receiver must safely accept the same change more than once.

change_id is the idempotency key.

Duplicate delivery must not create duplicate attendance entries, scores, payments, or report-card components.

## Ordering

Changes for the same logical record are ordered by version.

A receiver must not silently apply an older version over a newer one.

## Conflicts

If two authorized nodes change the same record concurrently, the sync engine creates a conflict instead of silently overwriting data.

The conflict retains both versions and the source device/user.

The school policy decides how the conflict is resolved.

## Example: weekly attendance

A teacher may record five days offline.

When connectivity returns, the sync engine can deliver five attendance changes, or a compact batch containing those five changes.

The admin node applies only changes it does not already have.

The admin view then reflects the complete week without the teacher manually resubmitting it.
