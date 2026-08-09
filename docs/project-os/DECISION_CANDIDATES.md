# Decision Candidates

## Decision 1 — Use PostgreSQL + Prisma as the primary database stack

- Type: Decision
- Decision: Keep PostgreSQL + Prisma as the active persistence layer
- Reason: The repository currently uses Prisma schema and PostgreSQL-backed services
- Evidence: prisma/schema.prisma, package.json, database/ repository files
- Status: Confirmed
- Confidence: High

## Decision 2 — Use a shared record schema for UI and backend mapping

- Type: Decision
- Decision: Keep schema definitions centralized in configs/record-schema.js
- Reason: This reduces duplication between frontend and backend logic
- Evidence: configs/record-schema.js and services/report-service.js
- Status: Confirmed
- Confidence: High

## Decision 3 — Treat AI as an assistive input layer, not the only source of truth

- Type: Decision
- Decision: AI should propose report values and user should review before saving
- Reason: Repository docs explicitly describe AI as assistive rather than authoritative
- Evidence: md-files/PROJECT_CONTEXT.md
- Status: Confirmed
- Confidence: High

## Decision 4 — Use gioRa as the main signal for completed vs pending status

- Type: Decision
- Decision: A report transitions to completed when gioRa is valid
- Reason: This is encoded in business logic and documented in project context
- Evidence: services/report-service.js, md-files/PROJECT_CONTEXT.md
- Status: Confirmed
- Confidence: High

## Decision 5 — Keep current sprint focused on P0/P1/P2 stability

- Type: Decision
- Decision: Prioritize core stability and data correctness before expanding to roadmap modules
- Reason: Product guidance explicitly prioritizes reliability over expansion in the current stage
- Evidence: md-files/TODO.md, md-files/processing.md
- Status: Confirmed
- Confidence: High

## Decision 6 — Human verification remains mandatory for AI-assisted records

- Type: Decision
- Decision: AI output is assistive only and must be reviewed before becoming an official record
- Reason: Security-oriented workflow requires human validation for uncertain or sensitive fields
- Evidence: md-files/TODO.md, md-files/processing.md
- Status: Confirmed
- Confidence: High

## Decision 7 — Treat P3-P8 as roadmap, not immediate sprint scope

- Type: Decision
- Decision: Do not auto-implement future modules (audit/evidence/access-control/reporting intelligence) without explicit tasks
- Reason: Prevent speculative implementation and protect core delivery focus
- Evidence: md-files/TODO.md, md-files/processing.md
- Status: Confirmed
- Confidence: High
