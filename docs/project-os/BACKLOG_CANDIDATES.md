# Backlog Candidates

## P0 — Core functionality stability

## 1. Integration test for create flow (raw text + images -> review -> save)

- Type: Task / Testing
- Reason: Core workflow is live and needs regression safety at integration level
- Priority: P0
- Suggested Status: Planned
- Confidence: High
- Source: md-files/TODO.md, md-files/processing.md

## 2. Integration test for pending -> completed update flow

- Type: Task / Testing
- Reason: Status transition is a core business rule and must be protected
- Priority: P0
- Suggested Status: Planned
- Confidence: High
- Source: md-files/TODO.md

## 3. Regression test for export-by-date and no-data errors

- Type: Task / Testing
- Reason: Export behavior is critical and should fail predictably when data is missing
- Priority: P0
- Suggested Status: Planned
- Confidence: High
- Source: md-files/TODO.md

## 4. Standardize API error response shape

- Type: Task / Reliability
- Reason: Frontend needs consistent error contracts to handle failures correctly
- Priority: P0
- Suggested Status: Planned
- Confidence: High
- Source: md-files/TODO.md, app.js

## P1 — Data correctness and reliability

## 5. Strengthen AI output validation and conflict warning

- Type: Backlog / Technical Debt
- Reason: Prevent incomplete or contradictory AI output from being saved without clear review signals
- Priority: P1
- Suggested Status: Planned
- Confidence: High
- Source: md-files/TODO.md, md-files/processing.md

## 6. Standardize key field mapping (plate, container, seal, document)

- Type: Backlog / Data Quality
- Reason: Reduce drift and mismatch in high-value logistics/security identifiers
- Priority: P1
- Suggested Status: Planned
- Confidence: Medium
- Source: md-files/TODO.md

## 7. Add tests for normalize/sanitize on time, id, and long text fields

- Type: Backlog / Testing
- Reason: Data normalization errors can silently impact downstream reports
- Priority: P1
- Suggested Status: Planned
- Confidence: High
- Source: md-files/TODO.md

## P2 — Database/data model stability

## 8. Review schema and aliases for semantic overlap

- Type: Backlog / Technical Debt
- Reason: Avoid duplicated meanings across fields and aliases in business terms
- Priority: P2
- Suggested Status: Planned
- Confidence: Medium
- Source: md-files/TODO.md

## 9. Evaluate index coverage for reportDate/status using real usage data

- Type: Backlog / Performance
- Reason: Query cost may increase with scale and should be validated with practical metrics
- Priority: P2
- Suggested Status: Planned
- Confidence: Medium
- Source: md-files/TODO.md, prisma/schema.prisma

## 10. Standardize migration + rollback process for staging

- Type: Backlog / Operations
- Reason: Safer release operations require consistent migration and rollback workflow
- Priority: P2
- Suggested Status: Planned
- Confidence: Medium
- Source: md-files/TODO.md

## 11. Define minimum production backup/recovery policy

- Type: Backlog / Operations
- Reason: Data safety policy is needed as production usage increases
- Priority: P2
- Suggested Status: Planned
- Confidence: Medium
- Source: md-files/TODO.md

## Roadmap (Deferred, not current sprint scope)

## 12. P3-P8 capabilities (record retrieval, audit trail, evidence, access control, audit packages, advanced detection)

- Type: Deferred / Roadmap
- Reason: These are acknowledged future stages and should not be auto-scheduled into current sprint
- Priority: Future
- Suggested Status: Deferred
- Confidence: High
- Source: md-files/TODO.md, md-files/processing.md
