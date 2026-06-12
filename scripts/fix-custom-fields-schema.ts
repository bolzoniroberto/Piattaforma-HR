import "dotenv/config";
import { sqlite } from "../server/db";

/**
 * Fix one-shot del drift schema delle tabelle custom fields.
 *
 * Causa: `scripts/migrate-performance.ts` (storico) creò custom_field_definitions
 * e custom_field_values con shape EAV (name/label, field_definition_id/entity_type)
 * sovrascrivendo la shape canonica della migration 0000. Lo schema runtime
 * (shared/schema.ts, customFieldsStorage.ts, docGen/employeeData.ts) usa invece
 * field_name/field_label/category e field_id/user_id → query a runtime falliscono
 * ("no such column: field_name"), rompendo la generazione lettere da DB.
 *
 * Fix: ricrea entrambe le tabelle con la DDL canonica (= shared/schema.ts).
 * Sicuro: il runtime non ha MAI potuto scrivere nella shape EAV (colonne diverse),
 * quindi un eventuale contenuto è solo della migration storica.
 *
 * Guarded + idempotente: se custom_field_definitions ha già `field_name`, esce.
 * Standalone — NON va nell'array incrementalMigrations (un DROP nel boot
 * cancellerebbe i dati ad ogni restart). Lanciare a mano:
 *   tsx scripts/fix-custom-fields-schema.ts
 */

function hasColumn(table: string, column: string): boolean {
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

if (hasColumn("custom_field_definitions", "field_name")) {
  console.log("Schema custom fields già corretto (field_name presente). Nessuna azione.");
  process.exit(0);
}

const defsCount = (sqlite.prepare("SELECT count(*) AS c FROM custom_field_definitions").get() as { c: number }).c;
const valsCount = (sqlite.prepare("SELECT count(*) AS c FROM custom_field_values").get() as { c: number }).c;
console.log(`Drift rilevato. Righe esistenti — definizioni:${defsCount} valori:${valsCount} (attese 0, shape EAV legacy).`);

sqlite.pragma("foreign_keys = OFF");
sqlite.exec(`
  DROP TABLE IF EXISTS custom_field_values;
  DROP TABLE IF EXISTS custom_field_definitions;

  CREATE TABLE custom_field_definitions (
    id text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
    field_name text NOT NULL,
    field_label text NOT NULL,
    field_type text NOT NULL,
    category text NOT NULL,
    section text,
    is_required integer DEFAULT 0 NOT NULL,
    is_active integer DEFAULT 1 NOT NULL,
    is_searchable integer DEFAULT 0 NOT NULL,
    display_order integer DEFAULT 0,
    placeholder text,
    help_text text,
    validation_rules text,
    options text,
    default_value text,
    created_by text REFERENCES users(id) ON DELETE SET NULL,
    created_at integer DEFAULT (unixepoch()),
    updated_at integer DEFAULT (unixepoch())
  );

  CREATE TABLE custom_field_values (
    id text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
    field_id text NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value text,
    created_at integer DEFAULT (unixepoch()),
    updated_at integer DEFAULT (unixepoch())
  );

  CREATE UNIQUE INDEX unique_field_user ON custom_field_values (field_id, user_id);
`);
sqlite.pragma("foreign_keys = ON");

console.log("Tabelle custom fields ricreate con shape canonica (schema.ts). Fix completato.");
