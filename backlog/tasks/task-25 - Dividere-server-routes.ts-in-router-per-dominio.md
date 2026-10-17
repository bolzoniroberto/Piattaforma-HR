---
id: TASK-25
title: Dividere server/routes.ts in router per dominio
status: To Do
assignee: []
created_date: '2026-10-16 09:23'
labels:
  - tech-debt
  - refactor
milestone: m-4
dependencies: []
references:
  - server/routes.ts
  - server/docGenRoutes.ts
priority: medium
type: chore
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`server/routes.ts` ha circa 3.200 righe e 147 handler. Dividerlo in router (auth, users, mbo, documents, letters, ai, settings) seguendo il pattern di `server/docGenRoutes.ts`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Nessun cambiamento di comportamento delle API
- [ ] #2 routes.ts contiene solo il montaggio dei router
<!-- AC:END -->
