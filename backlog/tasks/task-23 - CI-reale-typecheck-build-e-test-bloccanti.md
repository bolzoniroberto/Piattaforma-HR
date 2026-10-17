---
id: TASK-23
title: 'CI reale: typecheck, build e test bloccanti'
status: To Do
assignee: []
created_date: '2026-10-16 09:23'
labels:
  - tech-debt
  - ci
milestone: m-4
dependencies: []
references:
  - .github/workflows/test.yml
priority: high
type: chore
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In `.github/workflows/test.yml` i job integration ed e2e terminano con `|| echo "...skipped for now"` e non possono fallire; mancano typecheck e build. Aggiungere `npm run check` e la build, rimuovere `|| echo`, creare `tests/e2e`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Typecheck e build girano in CI
- [ ] #2 Un test fallito fa fallire la pipeline
<!-- AC:END -->
