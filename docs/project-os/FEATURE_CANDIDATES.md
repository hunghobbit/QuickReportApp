# Feature Candidates

## 1. Report CRUD Workflow

- Type: Feature
- Source: services/report-service.js, clients/src/components/report/*
- Evidence: create, read, update, and list operations are implemented
- Suggested Status: Stable / In Use
- Suggested Priority: Critical
- Confidence: High

## 2. Pending / Completed Status Handling

- Type: Feature
- Source: services/report-status.js, md-files/PROJECT_CONTEXT.md
- Evidence: reporting status is derived from gioRa and used in UI workflow
- Suggested Status: Stable
- Suggested Priority: High
- Confidence: High

## 3. Excel Export

- Type: Feature
- Source: services/excel-export.js, clients/src/contexts/ExportContext.jsx
- Evidence: export to Excel and export history exist
- Suggested Status: Stable / Mature
- Suggested Priority: High
- Confidence: High

## 4. AI Report Generation

- Type: Feature
- Source: server/ai/ai.service.js, clients/src/components/ai/AIReportGenerator.jsx
- Evidence: AI workflow exists for image/text-based report generation
- Suggested Status: In Progress / Improving
- Suggested Priority: High
- Confidence: High

## 5. Authentication

- Type: Feature
- Source: services/auth-service.js, clients/src/components/auth/LoginPage.jsx
- Evidence: JWT authentication and login workflow are present
- Suggested Status: Stable
- Suggested Priority: High
- Confidence: High

## 6. Multi-user / Team-based Workflow

- Type: Feature
- Source: prisma/schema.prisma, MULTI-USER-IMPLEMENTATION.md
- Evidence: User and team concepts are formalized in schema and docs
- Suggested Status: In Progress
- Suggested Priority: Medium
- Confidence: Medium
