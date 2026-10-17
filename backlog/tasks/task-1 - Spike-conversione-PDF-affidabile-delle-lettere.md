---
id: TASK-1
title: 'Spike: conversione PDF affidabile delle lettere'
status: Done
assignee: []
created_date: '2026-10-16 09:21'
updated_date: '2026-10-16 15:52'
labels:
  - lettere
  - spike
milestone: m-0
dependencies: []
references:
  - server/docGen/pdfConverter.ts
  - server/docGen/engine.ts
priority: high
type: spike
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il PDF è necessario per l'hash del documento e il sigillo di firma (M2).

Oggi `server/docGen/pdfConverter.ts` usa LibreOffice headless, ma `findLibreOffice` cerca solo con `which` e percorsi Linux: su Windows non trova l'eseguibile.

Valutare: LibreOffice cross-platform (percorsi Windows, variabile d'ambiente `LIBREOFFICE_PATH`) oppure un servizio/libreria dedicata. Registrare la scelta come decision.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Conversione DOCX→PDF funzionante su Windows (sviluppo) e sull'ambiente di produzione
- [x] #2 Percorso dell'eseguibile configurabile via variabile d'ambiente
- [x] #3 Decisione documentata con backlog decision
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
pdfConverter.ts riscritto: LIBREOFFICE_PATH, where/which, percorsi standard Windows/macOS/Linux, execFileSync senza shell, profilo LibreOffice temporaneo per conversione. Decisione: decision-1.

AC #1 da verificare: LibreOffice non è installato sul PC di sviluppo.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
LibreOffice Portable 26.2.4 (firma Authenticode verificata: Rare Ideas LLC per il pacchetto, The Document Foundation per soffice.exe) estratto con 7-Zip in %USERPROFILE%\Tools\LibreOfficePortable, configurato con LIBREOFFICE_PATH in .env.

`pdfConverter.ts`: LIBREOFFICE_PATH, where/which, percorsi standard Windows/macOS/Linux, execFileSync senza shell, profilo LibreOffice dedicato e riusato (20 s → 2,4 s per conversione dopo la prima).

Verificato end-to-end con una lettera reale: generazione → copia personale PDF → pubblicazione → apertura → OTP → firma → PDF sigillato (resa controllata). Decisione: decision-1.
<!-- SECTION:FINAL_SUMMARY:END -->
