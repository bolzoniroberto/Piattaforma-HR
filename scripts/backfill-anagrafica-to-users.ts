import "dotenv/config";
import { sqlite } from "../server/db";

/**
 * Backfill one-shot dei campi anagrafici ricchi dalle tabelle normalizzate
 * (organizzazione/contratti/sedi/ccnl/livelli_contrattuali) verso le nuove
 * colonne native su `users`.
 *
 * Idempotente + edit-safe: usa COALESCE(users.col, …) così non sovrascrive
 * mai un valore già presente (né backfillato in precedenza, né editato da UI).
 * Tocca solo gli utenti con codice_fiscale che esiste in `persona`.
 *
 * NOTA: NON va nell'array incrementalMigrations di server/db.ts — è uno
 * script standalone da lanciare a mano: `tsx scripts/backfill-anagrafica-to-users.ts`.
 */

const before = sqlite
  .prepare(
    `SELECT count(*) AS c FROM users
     WHERE codice_fiscale IS NOT NULL
       AND codice_fiscale IN (SELECT codice_fiscale FROM persona)`
  )
  .get() as { c: number };

console.log(`Utenti collegabili (CF presente in persona): ${before.c}`);

const result = sqlite
  .prepare(
    `UPDATE users SET
      area = COALESCE(users.area, (SELECT o.area FROM organizzazione o WHERE o.codice_fiscale = users.codice_fiscale)),
      sotto_area = COALESCE(users.sotto_area, (SELECT o.sotto_area FROM organizzazione o WHERE o.codice_fiscale = users.codice_fiscale)),
      unita_organizzativa = COALESCE(users.unita_organizzativa, (SELECT o.unita_organizzativa FROM organizzazione o WHERE o.codice_fiscale = users.codice_fiscale)),
      struttura_l1 = COALESCE(users.struttura_l1, (SELECT o.descrizione_struttura_l1 FROM organizzazione o WHERE o.codice_fiscale = users.codice_fiscale)),
      struttura_l2 = COALESCE(users.struttura_l2, (SELECT o.descrizione_struttura_l2 FROM organizzazione o WHERE o.codice_fiscale = users.codice_fiscale)),
      struttura_l3 = COALESCE(users.struttura_l3, (SELECT o.descrizione_struttura_l3 FROM organizzazione o WHERE o.codice_fiscale = users.codice_fiscale)),
      sede = COALESCE(users.sede, (SELECT s.descrizione_sede FROM organizzazione o JOIN sedi s ON s.id = o.sede_id WHERE o.codice_fiscale = users.codice_fiscale)),
      sede_comune = COALESCE(users.sede_comune, (SELECT s.comune FROM organizzazione o JOIN sedi s ON s.id = o.sede_id WHERE o.codice_fiscale = users.codice_fiscale)),
      sede_provincia = COALESCE(users.sede_provincia, (SELECT s.provincia FROM organizzazione o JOIN sedi s ON s.id = o.sede_id WHERE o.codice_fiscale = users.codice_fiscale)),
      cdc = COALESCE(users.cdc, (SELECT o.descrizione_cdc FROM organizzazione o WHERE o.codice_fiscale = users.codice_fiscale)),
      telefono = COALESCE(users.telefono, (SELECT ct.telefono FROM contatti ct WHERE ct.codice_fiscale = users.codice_fiscale)),
      indirizzo = COALESCE(users.indirizzo, (SELECT ct.indirizzo FROM contatti ct WHERE ct.codice_fiscale = users.codice_fiscale)),
      cap = COALESCE(users.cap, (SELECT ct.cap FROM contatti ct WHERE ct.codice_fiscale = users.codice_fiscale)),
      citta = COALESCE(users.citta, (SELECT ct.citta FROM contatti ct WHERE ct.codice_fiscale = users.codice_fiscale)),
      matricola = COALESCE(users.matricola, (SELECT p.matricola FROM persona p WHERE p.codice_fiscale = users.codice_fiscale)),
      data_assunzione = COALESCE(users.data_assunzione, (SELECT c.data_assunzione FROM contratti c WHERE c.codice_fiscale = users.codice_fiscale AND c.is_active = 1 LIMIT 1)),
      qualifica = COALESCE(users.qualifica, (SELECT c.qualifica FROM contratti c WHERE c.codice_fiscale = users.codice_fiscale AND c.is_active = 1 LIMIT 1)),
      job_title = COALESCE(users.job_title, (SELECT c.job_title FROM contratti c WHERE c.codice_fiscale = users.codice_fiscale AND c.is_active = 1 LIMIT 1)),
      livello = COALESCE(users.livello, (SELECT COALESCE(lc.descrizione_livello, c.livello) FROM contratti c LEFT JOIN livelli_contrattuali lc ON lc.id = c.livello_contrattuale_id WHERE c.codice_fiscale = users.codice_fiscale AND c.is_active = 1 LIMIT 1)),
      ccnl = COALESCE(users.ccnl, (SELECT cc.descrizione_ccnl FROM contratti c JOIN ccnl cc ON cc.id = c.ccnl_id WHERE c.codice_fiscale = users.codice_fiscale AND c.is_active = 1 LIMIT 1))
    WHERE users.codice_fiscale IS NOT NULL
      AND users.codice_fiscale IN (SELECT codice_fiscale FROM persona)`
  )
  .run();

console.log(`Righe users toccate: ${result.changes}`);

const populated = sqlite
  .prepare(
    `SELECT count(*) AS c FROM users
     WHERE area IS NOT NULL OR sede IS NOT NULL OR qualifica IS NOT NULL OR ccnl IS NOT NULL`
  )
  .get() as { c: number };

console.log(`Utenti con almeno un campo ricco popolato: ${populated.c}`);
console.log("Backfill completato.");
