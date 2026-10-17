---
id: TASK-4
title: Salvare le lettere singole per dipendente
status: Done
assignee: []
created_date: '2026-10-16 09:22'
updated_date: '2026-10-16 09:37'
labels:
  - lettere
milestone: m-0
dependencies:
  - TASK-1
  - TASK-2
  - TASK-3
references:
  - server/docGen/engine.ts
  - server/docGenRoutes.ts
priority: high
type: feature
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In `generateAll` (`server/docGen/engine.ts`) oltre allo ZIP salvare ogni lettera (PDF) come record `employee_letters`.

I file vanno in un archivio protetto fuori dalla webroot (es. `uploads/letters/<userId>/<letterId>.pdf`), con nomi basati sull'ID e non sul nome della persona. Calcolare lo sha256 al salvataggio. Le lettere nascono in stato bozza finché l'admin non pubblica.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ogni beneficiario abbinato ha un file PDF e un record employee_letters con sha256
- [x] #2 I nomi dei file non contengono dati personali
- [x] #3 Lo ZIP per l'admin continua a funzionare
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`generateAll` restituisce le copie personali (PDF se LibreOffice è disponibile, altrimenti DOCX). `server/letters/letterStore.ts`: archivio `uploads/letters/<userId>/<random>.<ext>`, percorso relativo in DB, sha256, lettura protetta da path traversal. La generazione crea righe `employee_letters` in stato draft. ZIP admin invariato (verificato).
<!-- SECTION:FINAL_SUMMARY:END -->
