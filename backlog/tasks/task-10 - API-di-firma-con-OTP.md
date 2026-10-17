---
id: TASK-10
title: API di firma con OTP
status: Done
assignee: []
created_date: '2026-10-16 09:22'
updated_date: '2026-10-16 12:28'
labels:
  - firma
  - api
milestone: m-1
dependencies:
  - TASK-8
  - TASK-9
priority: high
type: feature
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
- `POST /api/me/letters/:id/sign/otp`: genera un codice a 6 cifre, lo salva hashato e lo invia via MailProvider
- `POST /api/me/letters/:id/sign/verify`: verifica il codice

Requisiti: limite tentativi (5) e scadenza (10 min), confronto a tempo costante, invalidazione dopo l'uso, ricontrollo dello sha256 del documento prima di firmare, registrazione di IP e user agent.

> Nota: il valore probatorio della firma elettronica semplice dipende dal completamento di M6 (Sicurezza pre-produzione). In sviluppo si testa con l'autenticazione attuale.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Codice errato, scaduto o già usato viene rifiutato
- [x] #2 Dopo 5 tentativi falliti la richiesta è bloccata
- [x] #3 La firma fallisce se l'hash del documento non corrisponde
- [x] #4 Una lettera già firmata non può essere firmata di nuovo
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`server/letters/signatureService.ts` + rotte in `letterRoutes.ts`:
- GET /api/me/letters/:id/sign (testo della dichiarazione)
- POST /api/me/letters/:id/sign/otp: codice a 6 cifre, valido 10 min, HMAC con OTP_SECRET/SESSION_SECRET salato con l'id richiesta; cooldown 60 s (Retry-After), max 5 codici/ora, email mascherata nella risposta
- POST /api/me/letters/:id/sign/verify: dichiarazione obbligatoria, max 5 tentativi contati prima del confronto, timingSafeEqual, ricalcolo sha256 del file, transazione unica
Precondizioni lato server: lettera propria, firma richiesta, già aperta, in PDF, non firmata/sostituita/revocata.

Verificato end-to-end (20 casi): firma riuscita, codice errato, blocco, codice scaduto, codice invalidato da uno nuovo, file manomesso, altro utente, doppia firma, DOCX, eliminazione utente con firme.
<!-- SECTION:FINAL_SUMMARY:END -->
