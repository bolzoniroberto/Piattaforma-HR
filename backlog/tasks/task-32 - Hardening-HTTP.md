---
id: TASK-32
title: Hardening HTTP
status: To Do
assignee: []
created_date: '2026-10-16 09:23'
labels:
  - security
milestone: m-5
dependencies: []
references:
  - server/app.ts
  - server/emailService.ts
priority: medium
type: task
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
- attivare `helmet` e `express-rate-limit` (login, `/api/r/:token`, AI, OTP di firma)
- rendere obbligatori `SESSION_SECRET` e `JWT_SECRET` all'avvio (oggi c'è un fallback hardcoded in `server/emailService.ts`)
- cookie `secure` in produzione
- correggere il re-throw dopo la risposta nel gestore errori di `server/app.ts`
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Header di sicurezza presenti
- [ ] #2 Rate limit attivo sugli endpoint elencati
- [ ] #3 L'app non parte senza i secret configurati
<!-- AC:END -->
