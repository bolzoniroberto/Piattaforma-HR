---
id: TASK-12
title: UI di firma della lettera
status: Done
assignee: []
created_date: '2026-10-16 09:23'
updated_date: '2026-10-16 12:41'
labels:
  - firma
  - ui
milestone: m-1
dependencies:
  - TASK-7
  - TASK-10
references:
  - client/src/components/ui/input-otp.tsx
priority: high
type: feature
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nella pagina "Le mie lettere":
- la firma è possibile solo dopo aver aperto la lettera
- checkbox di dichiarazione di presa visione/accettazione
- invio del codice, inserimento con `client/src/components/ui/input-otp.tsx`, reinvio con cooldown
- download della versione firmata

> Nota: il valore probatorio della firma elettronica semplice dipende dal completamento di M6 (Sicurezza pre-produzione). In sviluppo si testa con l'autenticazione attuale.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il pulsante Firma è disabilitato finché la lettera non è stata aperta
- [x] #2 Errori di codice (errato, scaduto, bloccato) mostrati in modo chiaro
- [x] #3 Dopo la firma è scaricabile la versione con attestato
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`client/src/components/letters/SignLetterDialog.tsx` + integrazione in `MyLettersPage.tsx`: pulsante Firma disabilitato finché la lettera non è stata aperta; dichiarazione da accettare (testo dal server); invio codice con email mascherata e conto alla rovescia di scadenza; inserimento con InputOTP (firma automatica al sesto numero); messaggi d'errore del server (codice errato con tentativi rimasti, scaduto, bloccato, attesa per il reinvio); conferma con ID transazione. Banner di stato firma (richiesta/scadenza, firmata con ID, DOCX non firmabile) e link "Scarica l'originale".

Nota: flusso verificato via API; la UI non è stata ancora provata in un browser.
<!-- SECTION:FINAL_SUMMARY:END -->
