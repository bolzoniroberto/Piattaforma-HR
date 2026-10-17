---
id: decision-2
title: Provider email di produzione (SMTP o Microsoft Graph)
date: '2026-10-16 11:01'
status: proposed
---
## Context

La piattaforma invia email per la rendicontazione MBO e, con M2/M3, per i codici OTP di firma, la pubblicazione delle lettere e i promemoria. Per l'OTP l'email è il secondo fattore della firma elettronica semplice: deve arrivare in modo affidabile e da un mittente aziendale riconoscibile.

Il codice ora supporta tre provider dietro l'interfaccia `MailProvider` (`server/mail/mailProvider.ts`), scelti con `MAIL_PROVIDER`:

| Provider | Variabili | Note |
|---|---|---|
| `smtp` | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | nodemailer; relay SMTP aziendale o SMTP AUTH di Exchange Online |
| `graph` | `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `GRAPH_SENDER` | app registrata in Entra ID con permesso applicativo `Mail.Send`, invio da una casella condivisa |
| `console` | — | solo sviluppo: scrive le email nel log (codici OTP compresi) |

Senza `MAIL_PROVIDER` vale il comportamento precedente: SMTP se `SMTP_HOST` è impostato, altrimenti console. Per i link nelle email va impostato `APP_BASE_URL`.

## Decision

**Da decidere con IT.** Proposta: **Microsoft Graph** con una casella condivisa dell'HR (es. `noreply-hr@…`), perché:
- non richiede SMTP AUTH, che Microsoft sta dismettendo per Exchange Online, né un relay da mantenere;
- il permesso `Mail.Send` si può limitare alla sola casella mittente con una *application access policy* di Exchange;
- il segreto dell'app è ruotabile e tracciato in Entra ID.

SMTP resta valido se esiste già un relay interno autorizzato per applicazioni.

## Consequences

- Graph: serve una app registration (Entra ID) con consenso amministratore e la policy di accesso sulla casella; il client secret va gestito come segreto di produzione.
- In produzione il provider `console` non va mai usato: all'avvio viene registrato un avviso se nessun provider è configurato. Il controllo bloccante è previsto in M6 (hardening).
- Qualunque scelta, il resto del codice non cambia: si usa sempre `sendMail()`.
