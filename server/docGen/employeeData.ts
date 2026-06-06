import { db } from '../db';
import {
  users, persona, contatti, organizzazione, contratti, compensation,
  ruoli, sedi, ccnl, livelliContrattuali, customFieldDefinitions, customFieldValues,
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
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
      per: persona,
      cont: contatti,
      org: organizzazione,
      contr: contratti,
      comp: compensation,
      ruo: ruoli,
      sede: sedi,
      ccnlRow: ccnl,
      livello: livelliContrattuali,
      managerUser: manager,
    })
    .from(users)
    .leftJoin(persona, eq(persona.codiceFiscale, users.codiceFiscale))
    .leftJoin(contatti, eq(contatti.codiceFiscale, users.codiceFiscale))
    .leftJoin(organizzazione, eq(organizzazione.codiceFiscale, users.codiceFiscale))
    .leftJoin(contratti, and(eq(contratti.codiceFiscale, users.codiceFiscale), eq(contratti.isActive, true)))
    .leftJoin(compensation, and(eq(compensation.codiceFiscale, users.codiceFiscale), eq(compensation.isCurrent, true)))
    .leftJoin(ruoli, eq(ruoli.codiceFiscale, users.codiceFiscale))
    .leftJoin(sedi, eq(sedi.id, organizzazione.sedeId))
    .leftJoin(ccnl, eq(ccnl.id, contratti.ccnlId))
    .leftJoin(livelliContrattuali, eq(livelliContrattuali.id, contratti.livelloContrattualeId))
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

    const row: BeneficiaryRow = {
      // Required BeneficiaryRow fields
      nome_beneficiario: nomeCompleto,
      qualifica: r.contr?.qualifica ?? r.user.department ?? '',
      tipologia: 'employee',
      premio_max: 0,
      area: r.org?.area ?? r.user.department ?? '',
      obiettivi: [],

      // HR-specific fields
      nome: firstName,
      cognome: lastName,
      nome_completo: nomeCompleto,
      codice_fiscale: r.user.codiceFiscale ?? '',
      matricola: r.per?.matricola ?? (r.user as any).matricola ?? '',
      email: r.user.email ?? '',
      telefono: r.cont?.telefono ?? (r.user as any).telefono ?? '',
      indirizzo: r.cont?.indirizzo ?? r.user.indirizzo ?? '',
      cap: r.cont?.cap ?? r.user.cap ?? '',
      citta: r.cont?.citta ?? r.user.citta ?? '',
      department: r.user.department ?? '',
      cdc: r.org?.descrizioneCdc ?? (r.user as any).cdc ?? '',
      sotto_area: r.org?.sottoArea ?? '',
      unita_organizzativa: r.org?.unitaOrganizzativa ?? '',
      struttura_l1: r.org?.descrizioneStrutturaL1 ?? '',
      struttura_l2: r.org?.descrizioneStrutturaL2 ?? '',
      struttura_l3: r.org?.descrizioneStrutturaL3 ?? '',
      sede: r.sede?.descrizioneSede ?? '',
      sede_comune: r.sede?.comune ?? '',
      sede_provincia: r.sede?.provincia ?? '',
      data_assunzione: fmtDate(r.contr?.dataAssunzione),
      job_title: r.contr?.jobTitle ?? '',
      livello: r.livello?.descrizioneLivello ?? r.contr?.livello ?? '',
      ccnl: r.ccnlRow?.descrizioneCcnl ?? '',
      ral: r.comp?.ral ?? r.user.ral ?? 0,
      mbo_percentuale: r.comp?.mboPercentuale ?? r.user.mboPercentage ?? 0,
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
