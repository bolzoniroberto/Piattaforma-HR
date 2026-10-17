---
id: TASK-24
title: Test automatici per lettere e firma OTP
status: To Do
assignee: []
created_date: '2026-10-16 09:23'
labels:
  - tech-debt
  - test
milestone: m-4
dependencies:
  - TASK-12
  - TASK-23
priority: medium
type: task
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Unit e integration (Vitest + Supertest) su: accesso alle proprie lettere, isolamento tra utenti, flusso OTP (scadenza, tentativi, riuso), hash del documento. E2E Playwright "firma una lettera".
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Test integration per API lettere e firma
- [ ] #2 Test e2e del flusso completo di firma
- [ ] #3 Test eseguiti in CI
<!-- AC:END -->
