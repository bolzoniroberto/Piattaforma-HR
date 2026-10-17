---
id: TASK-20
title: Logger delle richieste senza dati personali
status: To Do
assignee: []
created_date: '2026-10-16 09:23'
labels:
  - compliance
milestone: m-3
dependencies: []
references:
  - server/app.ts
priority: medium
type: chore
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il logger in `server/app.ts` (righe 40-68) stampa i body JSON delle risposte (troncati a 80 caratteri), che possono contenere dati personali. Loggare solo metodo, path, status e durata.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Nessun body di risposta nei log
<!-- AC:END -->
