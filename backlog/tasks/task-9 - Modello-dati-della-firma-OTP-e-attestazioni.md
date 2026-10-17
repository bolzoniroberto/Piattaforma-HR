---
id: TASK-9
title: Modello dati della firma (OTP e attestazioni)
status: Done
assignee: []
created_date: '2026-10-16 09:22'
updated_date: '2026-10-16 12:28'
labels:
  - firma
  - db
milestone: m-1
dependencies:
  - TASK-2
references:
  - shared/schema.ts
priority: high
type: feature
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
- `signature_requests`: letterId, userId, hash del codice OTP, expiresAt (10 min), attempts (max 5), consumedAt, createdAt
- `letter_signatures`: letterId, userId, hash del documento originale, hash del PDF firmato, filePath firmato, IP, user agent, signedAt, transactionId

> Nota: il valore probatorio della firma elettronica semplice dipende dal completamento di M6 (Sicurezza pre-produzione). In sviluppo si testa con l'autenticazione attuale.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tabelle e migrazione create
- [x] #2 Il codice OTP non è mai salvato in chiaro
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Tabelle `signature_requests` (HMAC del codice, destinatario, scadenza, tentativi, consumato/invalidato, IP) e `letter_signatures` (transactionId, dichiarazione accettata, hash originale, hash/percorso del PDF firmato per TASK-11, IP, user agent, data) — migrazione 0009. `letter_signatures` usa ON DELETE RESTRICT: le firme sono prove legali; DELETE /api/users/:id ora risponde 409 se l'utente ha firmato (va disattivato). Storage: createSignatureRequest (invalida le precedenti), registerOtpAttempt (atomico), completeSignature (transazione unica: lettera firmata + OTP consumato + prova).
<!-- SECTION:FINAL_SUMMARY:END -->
