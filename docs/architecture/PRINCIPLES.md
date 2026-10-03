# Architecture Principles

## 1. Local first

A user must be able to create and inspect the records needed for their role without a network connection.

## 2. Record ownership

The school is the authority for official school records. A teacher or cashier may create a record, but submission does not automatically make it an official school record.

## 3. Explicit submission

A record moves through a lifecycle:

created -> pending -> sent -> received -> accepted/rejected

The original local record remains available until delivery is confirmed.

## 4. Transport independence

Business modules must not depend directly on HTTP, Bluetooth, Wi-Fi, QR, or any other transport.

The sync module owns transport.

## 5. Least privilege

Each app receives only the school data and actions required by its role.

## 6. Stable identity

Human-readable names can change. Internal IDs should remain stable.

## 7. Deterministic records

A submitted record should contain enough identity and metadata to determine its school, author, academic context, type, and unique identity without relying on hidden server state.
