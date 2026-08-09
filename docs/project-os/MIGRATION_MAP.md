# QuickReportApp — Migration Map

This document maps existing repository information to the proposed Notion Project OS structure.

| Existing Source | Suggested Notion Destination | Notes |
|-----------------|------------------------------|-------|
| md-files/TODO.md | Backlog / Sprint Tasks | Useful for current and near-term work |
| README.md | Project Overview / Documentation | Good high-level context |
| md-files/PROJECT_CONTEXT.md | Project Documentation / Business Rules | Contains workflow and reasoning |
| prisma/schema.prisma | Technical Architecture / Database | Source of truth for DB model structure |
| services/report-service.js | Feature Evidence / Product Logic | Shows current behavior and rules |
| services/excel-export.js | Feature Evidence / Export Feature | Evidence that export is a real implemented feature |
| server/ai/* | AI Feature / AI Progress | Capture as product capability and ongoing improvement area |
| DEPLOYMENT.md | Deployment / Release Notes | Useful for future release tracking |
| DATABASE-SETUP.md | Technical Setup / Environment | Keep as documentation, not as task backlog |

## Important Classification Rules

- Not every TODO item should become a feature.
- Items like “improve validation” or “add logging” are better classified as backlog or technical debt.
- Existing implementation files are evidence of a feature, but not proof that the feature is fully complete.
- Old experiments, personal notes, and temporary debugging logs should be skipped or archived.
