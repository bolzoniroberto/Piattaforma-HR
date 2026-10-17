---
id: TASK-19
title: Audit log generale
status: To Do
assignee: []
created_date: '2026-10-16 09:23'
labels:
  - compliance
milestone: m-3
dependencies: []
priority: medium
type: feature
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tabella `audit_events` (actorId, action, entity, entityId, metadata, ip, createdAt) e helper `audit()`. Eventi: login, modifiche a utenti e RAL, pubblicazione/visualizzazione/firma delle lettere, modifiche alle impostazioni. Vista admin con filtri. Oggi esiste solo `reporting_log` per le rendicontazioni.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Gli eventi elencati vengono registrati
- [ ] #2 Vista admin con filtri per utente, azione e periodo
- [ ] #3 Il log non è modificabile dall'applicazione
<!-- AC:END -->
