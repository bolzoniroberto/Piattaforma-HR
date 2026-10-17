---
id: TASK-31
title: Rimuovere impersonazione ed endpoint demo
status: To Do
assignee: []
created_date: '2026-10-16 09:23'
labels:
  - security
milestone: m-5
dependencies: []
references:
  - server/routes.ts
  - server/localAuth.ts
priority: medium
type: task
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
- header `x-demo-user-id` in `getUserId()` (`server/routes.ts` righe 61-69, circa 40 punti d'uso)
- i due `GET /api/demo-login/:role` (`localAuth.ts` e `routes.ts`)
- `GET /api/dev/users` senza login, che espone RAL ed email

Eliminarli o confinarli a `NODE_ENV=development`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 In produzione l'header x-demo-user-id viene ignorato
- [ ] #2 Gli endpoint demo e dev non sono raggiungibili in produzione
<!-- AC:END -->
