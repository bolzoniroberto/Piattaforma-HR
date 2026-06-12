import { db } from '../db';
import {
  users, customFieldDefinitions, customFieldValues,
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import type { BeneficiaryRow } from './excelParser';

function fmtDate(unix: number | null | undefined): string {
  if (!unix) return '';
  return new Date(unix * 1000).toLocaleDateString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export interface EmployeePreview {
  userId: string;
  nome: string;
  qualifica: string;
  tipologia: string;
  premioMax: number;
  nObiettivi: number;
}

export async function getEmployeesFromDb(): Promise<BeneficiaryRow[]> {
  // Alias for manager self-join
  const manager = alias(users, 'manager');

  const rows = await db
    .select({
      user: users,
      managerUser: manager,
    })
    .from(users)
    .leftJoin(manager, eq(manager.id, users.managerId))
    .where(eq(users.isActive, true))
    .orderBy(users.lastName, users.firstName);

  // Load custom fields
  const cfDefs = await db.select().from(customFieldDefinitions).where(eq(customFieldDefinitions.isActive, true));
  const cfVals = await db.select().from(customFieldValues);

  // Map custom field values by userId
  const cfByUser = new Map<string, Map<string, string>>();
  for (const val of cfVals) {
    if (!cfByUser.has(val.userId)) cfByUser.set(val.userId, new Map());
    const defn = cfDefs.find(d => d.id === val.fieldId);
    if (defn) cfByUser.get(val.userId)!.set(defn.fieldName, String(val.value ?? ''));
  }

  // Deduplicate by user id (multiple contratti rows could duplicate — take first per user)
  const seen = new Set<string>();
  const result: BeneficiaryRow[] = [];

  for (const r of rows) {
    const uid = r.user.id;
    if (seen.has(uid)) continue;
    seen.add(uid);

    const firstName = r.user.firstName ?? '';
    const lastName = r.user.lastName ?? '';
    const nomeCompleto = [firstName, lastName].filter(Boolean).join(' ');

    const customFields: Record<string, string> = {};
    const userCf = cfByUser.get(uid);
    if (userCf) {
      userCf.forEach((val, key) => { customFields[`cf_${key}`] = val; });
    }

    const u = r.user;
    const row: BeneficiaryRow = {
      // Required BeneficiaryRow fields
      nome_beneficiario: nomeCompleto,
      qualifica: u.qualifica ?? u.department ?? '',
      tipologia: 'employee',
      premio_max: 0,
      area: u.area ?? u.department ?? '',
      obiettivi: [],

      // HR-specific fields — tutti da users (fonte unica consolidata)
      nome: firstName,
      cognome: lastName,
      nome_completo: nomeCompleto,
      codice_fiscale: u.codiceFiscale ?? '',
      matricola: u.matricola ?? '',
      email: u.email ?? '',
      telefono: u.telefono ?? '',
      indirizzo: u.indirizzo ?? '',
      cap: u.cap ?? '',
      citta: u.citta ?? '',
      department: u.department ?? '',
      cdc: u.cdc ?? '',
      sotto_area: u.sottoArea ?? '',
      unita_organizzativa: u.unitaOrganizzativa ?? '',
      struttura_l1: u.strutturaL1 ?? '',
      struttura_l2: u.strutturaL2 ?? '',
      struttura_l3: u.strutturaL3 ?? '',
      sede: u.sede ?? '',
      sede_comune: u.sedeComune ?? '',
      sede_provincia: u.sedeProvincia ?? '',
      data_assunzione: fmtDate(u.dataAssunzione),
      job_title: u.jobTitle ?? '',
      livello: u.livello ?? '',
      ccnl: u.ccnl ?? '',
      ral: u.ral ?? 0,
      mbo_percentuale: u.mboPercentage ?? 0,
      manager_nome: r.managerUser?.firstName ?? '',
      manager_cognome: r.managerUser?.lastName ?? '',

      ...customFields,
    };

    result.push(row);
  }

  return result;
}

export async function getEmployeePreviews(): Promise<EmployeePreview[]> {
  const all = await getEmployeesFromDb();
  return all.map(b => ({
    userId: '',
    nome: b.nome_beneficiario,
    qualifica: String(b.qualifica ?? ''),
    tipologia: 'employee',
    premioMax: 0,
    nObiettivi: 0,
  }));
}
