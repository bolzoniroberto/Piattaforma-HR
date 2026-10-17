---
id: TASK-22
title: Cifratura delle lettere a riposo
status: To Do
assignee: []
created_date: '2026-10-16 09:23'
labels:
  - compliance
  - security
milestone: m-3
dependencies:
  - TASK-4
priority: low
type: feature
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Cifrare i file delle lettere (AES-256-GCM) con chiave da variabile d'ambiente o key vault; decifrare in streaming al download.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 I file su disco non sono leggibili senza chiave
- [ ] #2 Download e firma funzionano in modo trasparente
<!-- AC:END -->
