---
id: TASK-33
title: Controlli di autorizzazione
status: To Do
assignee: []
created_date: '2026-10-16 09:23'
labels:
  - security
milestone: m-5
dependencies: []
references:
  - server/aiSession.ts
  - client/src/App.tsx
priority: medium
type: task
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
- sessioni AI: `GET /api/ai/session/:id` e `/finalize` non verificano il proprietario; `/start` non è limitato ai manager
- allineare le guardie client/server: `/admin/doc-gen`, `/team`, `/organigramma` in `client/src/App.tsx` senza `requiredRole`
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Un utente non può leggere o finalizzare sessioni AI altrui
- [ ] #2 Le rotte admin sono protette anche lato client
<!-- AC:END -->
