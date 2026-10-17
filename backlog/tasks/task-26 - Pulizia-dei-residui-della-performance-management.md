---
id: TASK-26
title: Pulizia dei residui della performance management
status: To Do
assignee: []
created_date: '2026-10-16 09:23'
labels:
  - tech-debt
  - cleanup
milestone: m-4
dependencies: []
references:
  - shared/schema.ts
  - server/aiSession.ts
  - package.json
priority: low
type: chore
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
- Tabelle della performance ancora in `shared/schema.ts` (circa righe 1055-1712), `aiSessions.cycleId`, migrazione di drop
- `server/replitAuth.ts`, plugin Replit, `@types/connect-pg-simple`
- dichiarare `nanoid` in `package.json` (usato da `server/aiSession.ts`)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Nessuna tabella o codice della performance rimasto
- [ ] #2 Typecheck e build verdi
<!-- AC:END -->
