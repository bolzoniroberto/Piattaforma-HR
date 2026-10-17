---
id: TASK-2
title: Modello dati employee_letters
status: Done
assignee: []
created_date: '2026-10-16 09:22'
updated_date: '2026-10-16 09:28'
labels:
  - lettere
  - db
milestone: m-0
dependencies: []
references:
  - shared/schema.ts
  - db/migrations
priority: high
type: feature
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tabella che lega ogni lettera generata a un dipendente.

Campi: id, userId → users, jobId → doc_generation_jobs, templateId, letterType, title, filePath, sha256, requiresSignature, dueDate, status (`published`, `viewed`, `signed`, `revoked`), publishedAt, viewedAt, signedAt, createdAt.

Oggi esiste solo `doc_generation_jobs.output_zip_path` (uno ZIP per job).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tabella employee_letters definita in shared/schema.ts con tipi e insert schema zod
- [x] #2 Migrazione SQL in db/migrations applicabile su un DB esistente
- [x] #3 Funzioni di storage CRUD in server/storage.ts (per utente, per job, per id)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Tabella `employee_letters` (schema, migrazione 0007 idempotente registrata in server/db.ts) con stati draft/published/viewed/signed/revoked, file_format pdf|docx, sha256, replaces_id per le sostituzioni. Storage: getVisibleLettersForUser, getLettersByJob, getEmployeeLetter, create/update, publishJobLetters, revokeEmployeeLetter, markEmployeeLetterViewed. Migrazione verificata su una copia del DB.
<!-- SECTION:FINAL_SUMMARY:END -->
