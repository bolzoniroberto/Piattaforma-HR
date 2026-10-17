---
id: TASK-5
title: Pubblicazione delle lettere dall'admin
status: Done
assignee: []
created_date: '2026-10-16 09:22'
updated_date: '2026-10-16 09:37'
labels:
  - lettere
  - admin
milestone: m-0
dependencies:
  - TASK-4
references:
  - client/src/pages/AdminDocGenPage.tsx
  - server/docGenRoutes.ts
priority: high
type: feature
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Da un job completato in `AdminDocGenPage.tsx`: anteprima dei destinatari, scelta di "richiede firma" e scadenza, pubblicazione (tutti o selezione), revoca e sostituzione di una singola lettera.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 L'admin pubblica le lettere di un job a tutti o a una selezione
- [x] #2 Si può impostare requiresSignature e dueDate alla pubblicazione
- [x] #3 Una lettera può essere revocata o sostituita mantenendo lo storico
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Endpoint admin: GET /api/doc/jobs/:id/letters, POST /api/doc/jobs/:id/publish (selezione, firma richiesta, scadenza, sostituzione delle lettere dello stesso modello non firmate con replacesId), POST /api/doc/letters/:id/revoke (rifiuta firmate/già revocate), GET /api/doc/letters/:id/file. UI: `client/src/components/letters/JobLettersDialog.tsx` aperto da "Ultime generazioni" e dalla schermata post-generazione.
<!-- SECTION:FINAL_SUMMARY:END -->
