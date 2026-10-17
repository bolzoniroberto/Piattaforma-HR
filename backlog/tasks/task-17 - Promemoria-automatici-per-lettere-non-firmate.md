---
id: TASK-17
title: Promemoria automatici per lettere non firmate
status: To Do
assignee: []
created_date: '2026-10-16 09:23'
labels:
  - notifiche
milestone: m-2
dependencies:
  - TASK-12
  - TASK-15
priority: medium
type: feature
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Scheduler (es. `node-cron`) che invia promemoria per le lettere con firma richiesta non ancora firmate, in prossimità della scadenza, ed escalation all'HR dopo la scadenza. Frequenza configurabile.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Promemoria inviati N giorni prima della scadenza (configurabile)
- [ ] #2 Escalation all'HR per le lettere scadute
- [ ] #3 Nessun invio duplicato nello stesso giorno
<!-- AC:END -->
