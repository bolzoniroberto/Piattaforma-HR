---
id: TASK-27
title: Unificare la strategia di migrazione del DB
status: To Do
assignee: []
created_date: '2026-10-16 09:23'
labels:
  - tech-debt
  - db
milestone: m-4
dependencies: []
references:
  - db/migrations
  - drizzle.config.ts
priority: low
type: chore
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Oggi convivono SQL manuale in `db/migrations` e `drizzle-kit push`, e `scripts/apply-missing-tables.ts` indica drift dello schema. Passare a `drizzle-kit generate` + migrazioni versionate.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Una sola strategia documentata
- [ ] #2 scripts/apply-missing-tables.ts rimosso
<!-- AC:END -->
