import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { BeneficiaryRow } from './excelParser';

export type MatchMethod = 'db' | 'codice_fiscale' | 'email' | 'nome' | null;

export interface MatchReport {
  /** Index-aligned with the input rows. */
  methods: MatchMethod[];
  matchedCount: number;
  unmatchedNames: string[];
}

function normalizeName(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Links each recipient row to an active platform user, setting `row.user_id`.
 * Rows that already carry a user_id (DB sources) are kept as they are.
 * Order: codice fiscale, then email, then full name — the name is used only
 * when exactly one active user has it, to avoid assigning a letter to a homonym.
 */
export async function matchRecipientsToUsers(rows: BeneficiaryRow[]): Promise<MatchReport> {
  const active = await db
    .select({ id: users.id, cf: users.codiceFiscale, email: users.email, first: users.firstName, last: users.lastName })
    .from(users)
    .where(eq(users.isActive, true));

  const byCf = new Map<string, string>();
  const byEmail = new Map<string, string>();
  const byName = new Map<string, string[]>();
  for (const u of active) {
    if (u.cf) byCf.set(u.cf.toUpperCase(), u.id);
    if (u.email) byEmail.set(u.email.toLowerCase(), u.id);
    const first = u.first ?? '';
    const last = u.last ?? '';
    // Excel files may list "Nome Cognome" or "Cognome Nome": index both orders.
    const keys = [normalizeName(`${first} ${last}`), normalizeName(`${last} ${first}`)];
    keys.forEach((key, i) => {
      if (!key || (i === 1 && key === keys[0])) return;
      byName.set(key, [...(byName.get(key) ?? []), u.id]);
    });
  }

  const methods: MatchMethod[] = [];
  const unmatchedNames: string[] = [];

  for (const row of rows) {
    if (row.user_id) { methods.push('db'); continue; }

    const cf = String(row.codice_fiscale ?? '').trim().toUpperCase();
    const email = String(row.email ?? '').trim().toLowerCase();
    const nameMatches = byName.get(normalizeName(row.nome_beneficiario ?? '')) ?? [];

    let method: MatchMethod = null;
    let userId: string | undefined;
    if (cf && byCf.has(cf)) { userId = byCf.get(cf); method = 'codice_fiscale'; }
    else if (email && byEmail.has(email)) { userId = byEmail.get(email); method = 'email'; }
    else if (nameMatches.length === 1) { userId = nameMatches[0]; method = 'nome'; }

    if (userId) row.user_id = userId;
    else unmatchedNames.push(row.nome_beneficiario);
    methods.push(method);
  }

  return { methods, matchedCount: rows.length - unmatchedNames.length, unmatchedNames };
}
