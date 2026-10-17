---
id: TASK-34
title: Versioni delle lettere visibili a dipendente e admin
status: Done
assignee: []
created_date: '2026-10-16 09:42'
updated_date: '2026-10-16 09:46'
labels:
  - lettere
  - ui
milestone: m-0
dependencies:
  - TASK-5
  - TASK-7
priority: high
type: enhancement
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Oggi, quando l'admin rigenera e ripubblica una lettera, il dipendente non capisce che è una nuova versione: la vecchia sparisce (revocata) e la nuova ha lo stesso titolo; senza "sostituisci" vede due lettere identiche. `replacesId` è salvato ma non mostrato.

Proposta:
- numero di versione calcolato dalla catena `replaces_id`
- nel dettaglio dipendente: "Versione N · sostituisce la lettera del gg/mm/aaaa"
- versione precedente eventualmente visibile come "Sostituita" con link alla nuova (da decidere)
- motivo opzionale della nuova versione (da decidere)
- nella finestra admin: avviso "sostituirà la lettera pubblicata il …" prima della pubblicazione
- se la versione precedente è firmata: non si revoca, ma si collega e si avvisa l'admin
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il dipendente vede numero di versione e data della lettera sostituita
- [x] #2 L'admin vede prima della pubblicazione quali lettere verranno sostituite
- [x] #3 Le versioni firmate non vengono revocate ma restano collegate
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Nuovo stato `superseded` (distinto da `revoked`): la versione sostituita resta visibile al dipendente come "Sostituita", consultabile, con link alla nuova. Colonne `version_note` e `superseded_at` (migrazione 0008). `server/letters/versioning.ts` ricostruisce i numeri di versione dalla catena `replaces_id` (anche attraverso lettere revocate, con protezione dai cicli).

Dipendente: "v2" nell'elenco, banner con versione sostituita, motivo dell'aggiornamento, link alla versione precedente o successiva; per una lettera firmata seguita da una nuova versione, avviso che la firmata resta valida.
Admin: prima della pubblicazione ogni bozza indica "sostituirà la vN del …" (o avvisa se la vN è firmata, o se senza sostituzione il dipendente vedrà due lettere); campo "Motivo della nuova versione" facoltativo; dopo la pubblicazione mostra la catena.
Le lettere firmate non vengono mai marcate come sostituite: sono solo collegate (`signedLinked` nella risposta).

Verificato end-to-end: v1 → v2 con motivo → v3 su v2 firmata; file della versione sostituita apribile; la revoca di una sostituita è rifiutata.
<!-- SECTION:FINAL_SUMMARY:END -->
