import { db } from '../db';
import {
  users, objectiveAssignments, objectives, objectivesDictionary,
  indicatorClusters, calculationTypes,
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { BeneficiaryRow, ObiettivRow } from './excelParser';

function calcPremioMax(ral: number | null, mboPerc: number | null): number {
  if (!ral || !mboPerc) return 0;
  return Math.round((ral * mboPerc) / 100);
}

function fmtTarget(val: number | null, desc: string | null): string {
  if (desc && desc.trim()) return desc.trim();
  if (val != null) return String(val);
  return '';
}

function fmtPeso(w: number | null): string {
  return w != null ? `${w}%` : '';
}

export interface DbBeneficiaryPreview {
  userId: string;
  nome: string;
  qualifica: string;
  tipologia: string;
  premioMax: number;
  nObiettivi: number;
}

export async function getBeneficiariesFromDb(): Promise<BeneficiaryRow[]> {
  const rows = await db
    .select({
      user: users,
      assignment: objectiveAssignments,
      objective: objectives,
      dict: objectivesDictionary,
      cluster: indicatorClusters,
      calcType: calculationTypes,
    })
    .from(users)
    .innerJoin(objectiveAssignments, eq(objectiveAssignments.userId, users.id))
    .innerJoin(objectives, eq(objectives.id, objectiveAssignments.objectiveId))
    .innerJoin(objectivesDictionary, eq(objectivesDictionary.id, objectives.dictionaryId))
    .innerJoin(indicatorClusters, eq(indicatorClusters.id, objectivesDictionary.indicatorClusterId))
    .innerJoin(calculationTypes, eq(calculationTypes.id, objectivesDictionary.calculationTypeId))
    .where(eq(users.isActive, true))
    .orderBy(users.lastName, users.firstName, objectivesDictionary.createdAt);

  // Group by user
  const byUser = new Map<string, { user: typeof rows[0]['user']; obiettivi: ObiettivRow[] }>();

  for (const r of rows) {
    const uid = r.user.id;
    if (!byUser.has(uid)) {
      byUser.set(uid, { user: r.user, obiettivi: [] });
    }
    const entry = byUser.get(uid)!;
    const idx = entry.obiettivi.length + 1;
    entry.obiettivi.push({
      idx,
      codice: r.cluster.name ?? '',
      indicatore: r.dict.title ?? '',
      descrizione: r.dict.description ?? '',
      target: fmtTarget(r.dict.targetValue ?? null, r.dict.targetDescription ?? null),
      peso: fmtPeso(r.assignment.weight ?? null),
      modalita_calcolo: r.calcType.name ?? '',
      tipo_obiettivo: r.dict.objectiveType ?? '',
      rendicontatore: r.dict.dataSource ?? '',
      note: '',
    });
  }

  return Array.from(byUser.values()).map(({ user: u, obiettivi }) => ({
    nome_beneficiario: [u.firstName, u.lastName].filter(Boolean).join(' '),
    qualifica: u.department ?? '',
    tipologia: (u as any).beneficiaryType ?? 'standard',
    premio_max: calcPremioMax(u.ral ?? null, u.mboPercentage ?? null),
    area: u.department ?? '',
    codice_fiscale: u.codiceFiscale ?? '',
    indirizzo: u.indirizzo ?? '',
    cap: u.cap ?? '',
    citta_residenza: u.citta ?? '',
    prov: '',
    direzione: u.department ?? '',
    obiettivi,
  }));
}

export async function getDbBeneficiaryPreviews(): Promise<DbBeneficiaryPreview[]> {
  const all = await getBeneficiariesFromDb();
  return all.map(b => ({
    userId: '',
    nome: b.nome_beneficiario,
    qualifica: b.qualifica,
    tipologia: b.tipologia,
    premioMax: b.premio_max,
    nObiettivi: b.obiettivi.length,
  }));
}
