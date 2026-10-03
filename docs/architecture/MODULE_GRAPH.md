# Connected Module Graph

SkulGo is modular, but modules share stable IDs and record contracts.

## Foundation

identity -> school-records -> sync/replication -> permissions

## Academic chain

school setup -> classes/students/subjects -> teacher assignments -> attendance -> CA -> exams -> results -> report cards

## Other chains

school setup -> finance -> fees/payments -> receipts

school setup -> messaging

## Report card

The report card is not an isolated module.

It consumes connected official records:

- student identity
- class
- session
- term
- subject
- CA
- exam
- attendance where configured
- teacher remarks where configured
- school grading rules

A report card is therefore generated from the same records already maintained by SkulGo.

Modules communicate through stable IDs and structured records, not direct access to each other's private implementation.

## Implementation rule

A module must be usable independently, but its outputs must remain compatible with downstream modules.

For example, attendance does not know how a report card is rendered.

It only produces valid attendance records.

Results produces valid CA/exam/result records.

Report-card consumes those records and applies school configuration.
