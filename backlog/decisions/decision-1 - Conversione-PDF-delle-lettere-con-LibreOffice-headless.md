---
id: decision-1
title: Conversione PDF delle lettere con LibreOffice headless
date: '2026-10-16 09:27'
status: accepted
---
## Context

Le lettere vengono generate in DOCX (docxtemplater, carta intestata .docx caricata dall'admin). Per l'area personale e soprattutto per la firma OTP (hash del documento, pagina di attestazione con `pdf-lib`) serve un PDF fedele al DOCX.

`server/docGen/pdfConverter.ts` usava già LibreOffice, ma cercava l'eseguibile solo con `which` e percorsi Linux: su Windows non lo trovava mai.

Alternative valutate:
- **LibreOffice headless**: fedeltà buona su DOCX, gratuito, già integrato; richiede l'installazione sul server.
- **Librerie JS (docx → HTML → PDF)**: nessuna dipendenza esterna, ma la resa di carta intestata, intestazioni e tabelle è scarsa.
- **Servizi esterni / Microsoft Graph (conversione OneDrive)**: ottima fedeltà, ma i documenti personali escono dall'infrastruttura e serve un'integrazione Azure.

## Decision

Si resta su **LibreOffice headless**, reso cross-platform:
- percorso configurabile con la variabile d'ambiente `LIBREOFFICE_PATH`;
- ricerca nel PATH con `where` (Windows) / `which` (Linux, macOS) e nei percorsi d'installazione standard;
- `execFileSync` con argomenti separati (niente shell, niente problemi di quoting);
- profilo LibreOffice dedicato al server (`<tmp>/piattaforma-hr-libreoffice-profile`), separato da quello dell'utente e riusato tra le conversioni: crearne uno nuovo ogni volta costava ~20 s a lettera, riusandolo ~2,4 s (misurato con LibreOffice 26.2.4).

## Consequences

- Sviluppo e produzione devono avere LibreOffice installato (su Windows: installer da libreoffice.org; su Linux: `apt-get install libreoffice --no-install-recommends`).
- In sviluppo, senza diritti di amministratore, va bene la versione portable estratta con 7-Zip: `LIBREOFFICE_PATH=<cartella>\App\libreoffice\program\soffice.exe` (non il launcher `LibreOfficePortable.exe`). Il silent install del `.paf.exe` non funziona: apre comunque una finestra.
- Se LibreOffice manca, la generazione in DOCX continua a funzionare; le lettere salvate per il dipendente restano in DOCX (`employee_letters.file_format = 'docx'`) e non potranno essere firmate finché non sono in PDF.
- La conversione è sincrona: per lotti molto grandi andrà spostata in un job in background.
