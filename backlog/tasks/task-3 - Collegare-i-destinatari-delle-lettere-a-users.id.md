---
id: TASK-3
title: Collegare i destinatari delle lettere a users.id
status: Done
assignee: []
created_date: '2026-10-16 09:22'
updated_date: '2026-10-16 09:37'
labels:
  - lettere
milestone: m-0
dependencies: []
references:
  - server/docGen/employeeData.ts
  - server/docGen/dbBeneficiaries.ts
  - server/docGen/excelParser.ts
priority: high
type: enhancement
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`getEmployeesFromDb` (`server/docGen/employeeData.ts`) e `getBeneficiariesFromDb` (`server/docGen/dbBeneficiaries.ts`) scartano `users.id` (`userId: ''`). Per i dati da Excel (`excelParser.ts`) serve un abbinamento.

Abbinare per codice fiscale, poi per email; produrre un report delle righe non abbinate da mostrare all'admin prima della generazione.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Le righe da DB riportano userId valorizzato
- [x] #2 Le righe da Excel vengono abbinate per codice fiscale o email
- [x] #3 L'anteprima del job mostra le righe non abbinate
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`user_id` aggiunto a BeneficiaryRow e valorizzato dalle sorgenti DB (employeeData, dbBeneficiaries). Nuovo `server/docGen/recipientMatcher.ts`: abbinamento per codice fiscale → email → nome (solo se univoco, in entrambi gli ordini nome/cognome, senza accenti). Excel: nuove mappature opzionali `codice_fiscale` ed `email`. `preview-meta` restituisce `linked` e `unmatchedNames`; la lista destinatari mostra il badge "non abbinato" e un avviso. Verificato con un Excel di test (1 abbinato per nome, 1 non abbinato).
<!-- SECTION:FINAL_SUMMARY:END -->
