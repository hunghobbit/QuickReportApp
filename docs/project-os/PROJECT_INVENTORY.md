# QuickReportApp — Project Inventory

## Project

- Name: QuickReportApp
- Current Version: 1.0.0
- Current Branch: main
- Repository: QuickReportApp
- Last Updated: 2026-08-08

---

## Structure

### Frontend
- React 19 + Vite 8
- Tailwind CSS
- Components under clients/src/components
- AI modal and camera capture UI under clients/src/components/ai

### Backend
- Node.js + Express entrypoint: app.js
- API and service layer under services/ and server/
- AI generation flow under server/ai/

### Database
- PostgreSQL via Prisma
- Schema defined in prisma/schema.prisma
- Repository layer in database/

### Documentation
- Root docs: README.md, DATABASE-SETUP.md, DEPLOYMENT.md, MULTI-USER-IMPLEMENTATION.md
- Project context docs under md-files/

### AI
- Gemini/OpenRouter integration
- Multimodal image input support
- Prompt and parser modules in server/ai/

### Testing
- Vitest-based tests in services/report-status.test.js
- Additional AI-related tests under server/ai/ai.test.js

---

## Important Files

| File | Purpose | Status |
|------|---------|--------|
| README.md | Project overview | Active |
| md-files/TODO.md | Development plan and progress | Active |
| md-files/PROJECT_CONTEXT.md | Business workflow and architecture context | Active |
| package.json | Runtime and tooling dependencies | Active |
| prisma/schema.prisma | Database schema | Active |
| services/report-service.js | Business logic for report CRUD and status | Active |
| services/excel-export.js | Excel export and export history | Active |
| server/ai/ai.service.js | AI report generation service | Active |
| clients/src/components/ai/AIReportGenerator.jsx | Frontend AI workflow | Active |

---

## Existing Documentation

- Architecture context
- API workflow
- Database schema
- Prompt and AI workflow
- Deployment notes
- User/team and multi-user context

---

## Unknown / Unclear

- Exact production rollout timeline
- Whether some planned features are still pending or intentionally deferred
- Full list of real-world issues from production usage
