---
id: TASK-8
title: Spike e astrazione MailProvider (SMTP / Microsoft Graph)
status: In Progress
assignee: []
created_date: '2026-10-16 09:22'
updated_date: '2026-10-16 11:01'
labels:
  - firma
  - email
  - spike
milestone: m-1
dependencies: []
references:
  - server/emailService.ts
priority: high
type: spike
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il canale email è da decidere. Introdurre un'interfaccia `MailProvider` con implementazione SMTP (refactor di `server/emailService.ts`, nodemailer) e Microsoft Graph, scelta via variabile d'ambiente. Template email condivisi (OTP, pubblicazione lettera, promemoria). In sviluppo, provider "console" che logga.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Interfaccia MailProvider con implementazioni SMTP, Graph e console
- [x] #2 Le email di rendicontazione esistenti continuano a funzionare
- [ ] #3 Decisione sul provider di produzione documentata
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementato `server/mail/`:
- `mailProvider.ts`: interfaccia MailProvider, provider smtp (nodemailer), graph (client credentials + sendMail, token in cache, nessuna dipendenza nuova), console; selezione con MAIL_PROVIDER (default retrocompatibile: smtp se SMTP_HOST, altrimenti console); versione testo derivata dall'HTML.
- `templates.ts`: layout comune ed escape HTML di tutti i valori (prima i template interpolavano senza escape).
- `letterEmails.ts`: template OTP firma, pubblicazione lettera (anche nuova versione con motivo), promemoria firma; `appBaseUrl()` usa APP_BASE_URL.
- `emailService.ts` migrato: stesse funzioni, stesso contenuto.

Verifiche: console, SMTP contro un server SMTP di prova locale (parti text+html), Graph con fetch simulato (token riusato), valore MAIL_PROVIDER non valido rifiutato, escape HTML.

AC #3 in attesa: decision-2 è "proposed" (proposta Graph), la scelta spetta a IT/HR.
<!-- SECTION:NOTES:END -->
