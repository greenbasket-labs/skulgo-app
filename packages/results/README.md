# Results Module

Results is the connected academic assessment module.

## Components

- continuous assessment (CA)
- examination
- computed total
- grade
- subject result

Teachers enter CA and exam data only for their assigned class + subject.

## Record flow

Teacher device -> local result record -> sync outbox -> authorized admin node -> official school result.

No repeated data entry should be required on the admin side.

## Downstream

Official result records are consumed by:

- result summaries
- report cards
- transcripts where later implemented
- academic analytics where later implemented

The result module does not own report-card rendering.
