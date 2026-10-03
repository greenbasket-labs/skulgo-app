# Report Card Module

The report-card module assembles a student's academic record from connected official modules.

## Inputs

- student
- class
- session
- term
- subjects
- CA records
- exam records
- grading configuration
- attendance where configured
- teacher remarks where configured

## Principle

Do not make teachers or admins enter the same academic information a second time for report cards.

The report card reads the authoritative records already produced by the attendance and results modules.

## Example flow

Teacher enters Mathematics CA and exam.

-> result records synchronize

-> admin node receives official results

-> report-card module sees the results

-> student's report card reflects them

The same pattern applies across subjects.

## Privacy

Report cards are school records. Visibility to parents/students is controlled separately from teacher access.
