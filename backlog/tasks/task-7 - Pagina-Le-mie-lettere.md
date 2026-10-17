---
id: TASK-7
title: Pagina "Le mie lettere"
status: Done
assignee: []
created_date: '2026-10-16 09:22'
updated_date: '2026-10-16 09:37'
labels:
  - lettere
  - ui
milestone: m-0
dependencies:
  - TASK-6
references:
  - client/src/lib/navigationConfig.ts
  - client/src/contexts/FeatureFlagsContext.tsx
  - client/src/components/DocumentList.tsx
priority: high
type: feature
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pagina nell'area personale con elenco, stato e filtri, visualizzatore PDF e download.

Aggiungere voce di menu in `navigationConfig.ts` e feature flag `gestione_lettere_user` / `gestione_lettere_admin` in `FeatureFlagsContext.tsx`. Valutare il riuso di `client/src/components/DocumentList.tsx` (oggi non usato).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il dipendente vede le proprie lettere con stato (nuova, letta, firmata)
- [x] #2 Il PDF si apre nel browser e si può scaricare
- [x] #3 La voce di menu è governata dal feature flag
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`client/src/pages/MyLettersPage.tsx` su /lettere: filtri (Tutte, Da leggere, Da firmare, Firmate), visualizzatore PDF in iframe o DOCX con docx-preview, download. Voce "Area personale › Le mie lettere" con flag `gestione_lettere_admin/_user` (client, server e tab Moduli delle Impostazioni). DocumentList.tsx non riusato: è pensato per i documenti globali con accettazione.
<!-- SECTION:FINAL_SUMMARY:END -->
