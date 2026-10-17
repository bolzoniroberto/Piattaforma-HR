---
id: TASK-6
title: API del dipendente per le proprie lettere
status: Done
assignee: []
created_date: '2026-10-16 09:22'
updated_date: '2026-10-16 09:37'
labels:
  - lettere
  - api
milestone: m-0
dependencies:
  - TASK-2
references:
  - server/routes.ts
priority: high
type: feature
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Endpoint:
- `GET /api/me/letters`: elenco delle lettere pubblicate dell'utente loggato
- `GET /api/me/letters/:id/file`: stream del PDF con controllo che la lettera appartenga all'utente
- alla prima apertura impostare `viewedAt` e lo stato `viewed`
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Un utente non può accedere alle lettere di un altro (404/403)
- [x] #2 Le lettere revocate non compaiono e non sono scaricabili
- [x] #3 viewedAt viene impostato solo alla prima apertura
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`server/letters/letterRoutes.ts` montato su /api/me/letters (isAuthenticated). Utente sempre dalla sessione, mai dall'header demo. Lettere altrui, bozze e revocate → 404; filePath mai esposto. Prima apertura → status viewed + viewedAt. Header no-store e nosniff. Verificato con curl: isolamento tra utenti (404), senza login (401), dipendente su API admin (403).
<!-- SECTION:FINAL_SUMMARY:END -->
