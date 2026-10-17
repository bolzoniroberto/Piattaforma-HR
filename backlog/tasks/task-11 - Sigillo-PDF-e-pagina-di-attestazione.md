---
id: TASK-11
title: Sigillo PDF e pagina di attestazione
status: Done
assignee: []
created_date: '2026-10-16 09:23'
updated_date: '2026-10-16 12:41'
labels:
  - firma
milestone: m-1
dependencies:
  - TASK-10
priority: high
type: feature
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Con `pdf-lib` aggiungere al PDF una pagina di attestazione: firmatario, codice fiscale, data e ora, IP, hash del documento originale, ID transazione, metodo (OTP via email). Salvare una copia firmata immutabile e il suo hash; l'originale resta intatto.

> Nota: il valore probatorio della firma elettronica semplice dipende dal completamento di M6 (Sicurezza pre-produzione). In sviluppo si testa con l'autenticazione attuale.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il PDF firmato contiene la pagina di attestazione con tutti i dati
- [x] #2 L'hash del PDF firmato è registrato in letter_signatures
- [x] #3 Il file originale non viene modificato
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`server/letters/pdfSeal.ts` (pdf-lib 1.17.1): pagine originali con riga a piè di pagina "Firmato elettronicamente da … - ID transazione …" + pagina finale "Attestato di firma elettronica semplice" (documento, firmatario, CF, data/ora Europe/Rome, metodo, email OTP, IP, browser, SHA-256 dell'originale, ID transazione, dichiarazione); metadati PDF con transazione e hash. Copia firmata salvata a parte (`letter_signatures.signed_file_path/signed_sha256`), originale intatto. Ordine: sigillo → file → transazione; se la transazione fallisce il file firmato viene cancellato. Le lettere firmate si scaricano nella versione sigillata (dipendente e admin), l'originale con ?original=1.

Verificato: 2 pagine → 3, hash originale/firmata coerenti con il DB, originale invariato, metadati, resa visiva controllata.
<!-- SECTION:FINAL_SUMMARY:END -->
