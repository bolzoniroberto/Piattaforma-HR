import "dotenv/config";
import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { db, sqlite } from "../server/db";
import {
  users,
  indicatorClusters,
  calculationTypes,
  objectivesDictionary,
  objectives,
  objectiveAssignments,
  mboHistory,
} from "../shared/schema";

// ─── Files ───────────────────────────────────────────────────────────────────

const MASTER_DIR = path.resolve(__dirname, "../Masterdata obiettivi e assegnazioni");
const FILE_2026 = path.join(MASTER_DIR, "20260507_MBO2026_GoalSetting_v2 (1).xlsx");
const FILE_2025 = path.join(MASTER_DIR, "MBO2025_Rendicontazione_v9.xlsx");

// ─── Prefixed IDs (idempotenti, rimovibili) ────────────────────────────────────

const P = "mbo26-";
const CL_GRUPPO = `${P}cluster-gruppo`;
const CL_INDIV = `${P}cluster-individuali`;
const CL_ESG = `${P}cluster-esg`;
const CALC_NUM = `${P}calc-numerico`;
const CALC_QUAL = `${P}calc-qualitativo`;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function normName(name: string): string {
  return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return { lastName: parts[0] ?? "", firstName: parts.slice(1).join(" ") };
}

function nameToEmail(fullName: string): string {
  const { firstName, lastName } = splitName(fullName);
  const nome = slugify(firstName) || "x";
  const cognome = slugify(lastName) || "x";
  return `${nome}.${cognome}@24ore.com`;
}

function parsePercent(val: unknown): number | null {
  if (val == null) return null;
  const n = parseFloat(String(val).replace("%", "").replace(",", ".").trim());
  return isNaN(n) ? null : Math.round(n);
}

function parseNum(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function beneficiaryTypeFor(tipologia: string): "standard" | "DIRS" | "CEO" {
  const t = (tipologia ?? "").trim().toUpperCase();
  if (t === "AD") return "CEO";
  if (t === "DIRS") return "DIRS";
  return "standard"; // "Direttore Editoriale...", "Altri Beneficiari", ecc.
}

function clusterFor(tipoObiettivo: string): string {
  const t = (tipoObiettivo ?? "").toUpperCase();
  if (t.includes("GRUPPO") || t.includes("STRATEG")) return CL_GRUPPO;
  if (t.includes("ESG") || t.includes("SOSTENIB")) return CL_ESG;
  return CL_INDIV;
}

function isNumericTarget(val: unknown): boolean {
  if (val == null) return false;
  const cleaned = String(val).replace(/[.,\s]/g, "");
  return /^\d+$/.test(cleaned);
}

function sheetRows(file: string, sheetName: string): any[][] {
  const wb = XLSX.readFile(file);
  const ws = wb.Sheets[sheetName] ?? wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null, blankrows: false });
}

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══ Import MBO 2026 + storicizzazione 2025 ═══\n");

  // ── 1. Riepilogo Beneficiari (lista canonica) ──────────────────────────────
  const riepilogo = sheetRows(FILE_2026, "Riepilogo Beneficiari");
  // header su riga 1 (index 1): Manager,Beneficiario,Ruolo,Area,Tipologia,...,Premio Max(€) col 11
  const benefRows = riepilogo.slice(2).filter(r => r[1]);

  interface Person {
    fullName: string;
    manager: string;       // nome manager o "CDA"
    ruolo: string;
    area: string;
    tipologia: string;
    premio: number | null;
  }
  const people = new Map<string, Person>();
  for (const r of benefRows) {
    const fullName = String(r[1]).trim();
    people.set(normName(fullName), {
      fullName,
      manager: String(r[0] ?? "").trim(),
      ruolo: String(r[2] ?? "").trim(),
      area: String(r[3] ?? "").trim(),
      tipologia: String(r[4] ?? "").trim(),
      premio: parseNum(r[11]),
    });
  }
  console.log(`Beneficiari 2026: ${people.size}`);

  // Mappa nome→userId e set dei manager
  const idFor = (fullName: string) => `${P}${slugify(fullName)}`;
  const managers = new Set<string>();
  for (const p of people.values()) {
    if (p.manager && p.manager.toUpperCase() !== "CDA") managers.add(normName(p.manager));
  }

  // ── 2. Cluster + Calculation types ─────────────────────────────────────────
  await db.insert(indicatorClusters).values([
    { id: CL_GRUPPO, name: "Obiettivi di Gruppo", description: "Obiettivi di gruppo / strategici (A)" },
    { id: CL_INDIV, name: "Obiettivi Individuali", description: "Obiettivi di performance individuali (B)" },
    { id: CL_ESG, name: "Obiettivi ESG", description: "Obiettivi di sostenibilità / ESG (C)" },
  ]).onConflictDoNothing();

  await db.insert(calculationTypes).values([
    { id: CALC_NUM, name: "Numerico", description: "Interpolazione lineare su valore numerico", formula: "linear_interpolation" },
    { id: CALC_QUAL, name: "Qualitativo", description: "Soglie / curva su target descrittivo", formula: "threshold_curve" },
  ]).onConflictDoNothing();
  console.log("Cluster + tipi calcolo: ok");

  // ── 2.5 Pulizia PRIMA degli insert: rimuove SOLO obiettivi/dizionario legacy ─
  // (libera FK per re-import pulito). Ordine: figli → padri.
  // NOTA: NON si cancellano più gli utenti. Re-import idempotente via
  // onConflictDoUpdate(target: users.id) con id stabile `mbo26-<slug>`.
  // Cancellare gli utenti distruggeva dati non-2026 aggiunti a mano (perdita dati).
  const del = (s: string) => sqlite.prepare(s).run().changes;
  const c0Asgn = del(`DELETE FROM objective_assignments WHERE id NOT LIKE 'mbo26-%'`);
  const c0Obj = del(`DELETE FROM objectives WHERE id NOT LIKE 'mbo26-%'`);
  const c0Dict = del(`DELETE FROM objectives_dictionary WHERE id NOT LIKE 'mbo26-%'`);
  const c0Cl = del(`DELETE FROM indicator_clusters WHERE id NOT LIKE 'mbo26-%'`);
  const c0Calc = del(`DELETE FROM calculation_types WHERE id NOT LIKE 'mbo26-%'`);
  console.log(`Pulizia pre-insert — assegnazioni:${c0Asgn} obiettivi:${c0Obj} dizionario:${c0Dict} cluster:${c0Cl} calc:${c0Calc}`);

  // ── 3. Upsert utenti (premio, gerarchia, tipologia) ────────────────────────
  for (const p of people.values()) {
    const { firstName, lastName } = splitName(p.fullName);
    const role = managers.has(normName(p.fullName)) ? "manager" : "employee";
    const row = {
      id: idFor(p.fullName),
      email: nameToEmail(p.fullName),
      firstName,
      lastName,
      department: p.area || null,
      role,
      beneficiaryType: beneficiaryTypeFor(p.tipologia),
      premio: p.premio,
      managerId: null as string | null, // impostato nella 2ª passata (il manager deve esistere)
      isActive: true,
    };
    await db.insert(users).values(row as any)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: row.email, firstName: row.firstName, lastName: row.lastName,
          department: row.department, role: row.role, beneficiaryType: row.beneficiaryType,
          premio: row.premio, isActive: true,
          updatedAt: sql`(unixepoch())`,
        },
      });
  }
  // managerId in seconda passata (garantisce che il manager esista già)
  for (const p of people.values()) {
    const managerId =
      p.manager && p.manager.toUpperCase() !== "CDA" && people.has(normName(p.manager))
        ? idFor(people.get(normName(p.manager))!.fullName)
        : null;
    await db.update(users).set({ managerId }).where(eq(users.id, idFor(p.fullName)));
  }
  console.log(`Utenti upsert: ${people.size} (manager: ${managers.size})`);

  // ── 4. Dettaglio Obiettivi → dizionario + istanze + assegnazioni ───────────
  const dettaglio = sheetRows(FILE_2026, "Dettaglio Obiettivi");
  // header riga 1; indici: 1 benef,2 resp,3 area,4 tipScheda,5 tipoObj,6 codice,7 indicatore,8 descr,9 peso,10 modalita,11 target,12 rendic,13 note
  const objRows = dettaglio.slice(2).filter(r => r[1] && r[7]);

  interface Dict {
    id: string; objId: string;
    title: string; description: string | null;
    clusterId: string; calcId: string;
    objectiveType: "numeric" | "qualitative";
    targetValue: number | null; targetDescription: string | null;
    dataSource: string | null;
  }
  const dictMap = new Map<string, Dict>(); // dictKey → entry
  let dseq = 0;
  function dictKeyOf(codice: string, indicatore: string) {
    return `${codice.trim().toUpperCase()}::${indicatore.trim().toLowerCase()}`;
  }

  for (const r of objRows) {
    const codice = String(r[6] ?? "").trim();
    const indicatore = String(r[7] ?? "").trim();
    const key = dictKeyOf(codice, indicatore);
    if (dictMap.has(key)) continue;
    const numeric = isNumericTarget(r[11]);
    dseq++;
    const seqId = String(dseq).padStart(4, "0");
    dictMap.set(key, {
      id: `${P}dict-${seqId}`,
      objId: `${P}obj-${seqId}`,
      title: indicatore,
      description: r[8] ? String(r[8]).trim() : null,
      clusterId: clusterFor(String(r[5] ?? "")),
      calcId: numeric ? CALC_NUM : CALC_QUAL,
      objectiveType: numeric ? "numeric" : "qualitative",
      targetValue: numeric ? parseNum(r[11]) : null,
      targetDescription: !numeric && r[11] ? String(r[11]).trim() : null,
      dataSource: r[12] ? String(r[12]).trim() : null,
    });
  }

  const dictEntries = Array.from(dictMap.values());
  for (const d of dictEntries) {
    await db.insert(objectivesDictionary).values({
      id: d.id, title: d.title, description: d.description,
      indicatorClusterId: d.clusterId, calculationTypeId: d.calcId,
      objectiveType: d.objectiveType, targetValue: d.targetValue,
      targetDescription: d.targetDescription, dataSource: d.dataSource,
    } as any).onConflictDoNothing();
    await db.insert(objectives).values({
      id: d.objId, dictionaryId: d.id, clusterId: d.clusterId,
    } as any).onConflictDoNothing();
  }
  console.log(`Dizionario + istanze obiettivi: ${dictEntries.length}`);

  // Assegnazioni (una per beneficiario+obiettivo)
  let assignCount = 0, skipped = 0;
  const seen = new Set<string>();
  for (const r of objRows) {
    const benef = normName(String(r[1]));
    if (!people.has(benef)) { skipped++; continue; }
    const userId = idFor(people.get(benef)!.fullName);
    const key = dictKeyOf(String(r[6] ?? ""), String(r[7] ?? ""));
    const d = dictMap.get(key)!;
    const dedupe = `${userId}::${d.objId}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const weight = parsePercent(r[9]) ?? 0;
    await db.insert(objectiveAssignments).values({
      id: `${P}asgn-${slugify(people.get(benef)!.fullName)}-${d.objId.replace(P, "")}`,
      userId, objectiveId: d.objId, weight, status: "assegnato", progress: 0,
    } as any).onConflictDoNothing();
    assignCount++;
  }
  console.log(`Assegnazioni: ${assignCount} (righe scartate senza beneficiario: ${skipped})`);

  // ── 5. Storicizzazione 2025 (track record) ─────────────────────────────────
  const hist = sheetRows(FILE_2025, "MBO 2025 - Rendicontazione");
  // header riga 0; 0 id,1 benef,2 area,3 tipoObj,4 codice,5 indicatore,6 peso,7 target,8 rendic,9 referente,10 consuntivo,11 %ragg,12 %pesoEff,13 note
  const histRows = hist.slice(1).filter(r => r[1] && r[5]);
  let histInserted = 0;
  const histUnmatched = new Set<string>();
  for (const r of histRows) {
    const benef = normName(String(r[1]));
    if (!people.has(benef)) { histUnmatched.add(String(r[1]).trim()); continue; }
    const userId = idFor(people.get(benef)!.fullName);
    await db.insert(mboHistory).values({
      id: `${P}hist-2025-${String(r[0] ?? histInserted).replace(/[^A-Za-z0-9]/g, "")}-${slugify(people.get(benef)!.fullName)}`,
      userId, year: 2025,
      objectiveCode: r[4] ? String(r[4]).trim() : null,
      objectiveType: r[3] ? String(r[3]).trim() : null,
      area: r[2] ? String(r[2]).trim() : null,
      indicatore: String(r[5]).trim(),
      weight: parsePercent(r[6]),
      target: r[7] != null ? String(r[7]).trim() : null,
      consuntivo: r[10] != null ? String(r[10]).trim() : null,
      achievementPct: parsePercent(r[11]),
      effectiveWeight: parsePercent(r[12]),
      dataSource: r[8] ? String(r[8]).trim() : null,
      referente: r[9] ? String(r[9]).trim() : null,
      note: r[13] ? String(r[13]).trim() : null,
    } as any).onConflictDoNothing();
    histInserted++;
  }
  console.log(`Storico 2025 inserito: ${histInserted} righe; beneficiari 2025 non più presenti (scartati): ${histUnmatched.size}`);

  // ── Riepilogo finale ───────────────────────────────────────────────────────
  const c = (t: string) => (sqlite.prepare(`SELECT COUNT(*) n FROM ${t}`).get() as any).n;
  console.log("\n═══ Stato finale DB ═══");
  console.log(`  users:                 ${c("users")}`);
  console.log(`  objective_assignments: ${c("objective_assignments")}`);
  console.log(`  objectives:            ${c("objectives")}`);
  console.log(`  objectives_dictionary: ${c("objectives_dictionary")}`);
  console.log(`  indicator_clusters:    ${c("indicator_clusters")}`);
  console.log(`  calculation_types:     ${c("calculation_types")}`);
  console.log(`  mbo_history:           ${c("mbo_history")}`);
  console.log("\n✓ Import completato.");
}

main().then(() => process.exit(0)).catch(err => {
  console.error("Errore import:", err);
  process.exit(1);
});
