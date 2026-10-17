---
id: TASK-30
title: Autenticazione reale
status: To Do
assignee: []
created_date: '2026-10-16 09:23'
labels:
  - security
milestone: m-5
dependencies:
  - TASK-29
references:
  - server/localAuth.ts
priority: medium
type: feature
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`server/localAuth.ts` (righe 47-58) accetta qualsiasi password. Implementare il metodo scelto e rimuovere il bypass.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Login con credenziali errate rifiutato
- [ ] #2 Nessun bypass attivo fuori da NODE_ENV=development
<!-- AC:END -->
