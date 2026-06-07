import "dotenv/config";
import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { db } from "../server/db";
import {
  users,
  indicatorClusters,
  calculationTypes,
  objectivesDictionary,
  objectives,
  objectiveAssignments,
} from "../shared/schema";

// ─── Constants ───────────────────────────────────────────────────────────────

const EXCEL_PATH = path.resolve(
  __dirname,
  "../Masterdata obiettivi e assegnazioni/MBO2025_Rendicontazione_v9.xlsx"
);

const CLUSTER_GRUPPO_ID = "cluster-gruppo-001";
const CLUSTER_PERFORMANCE_ID = "cluster-perf-001";
const CLUSTER_ESG_ID = "cluster-esg-001";

const CALC_NUMERIC_ID = "calc-numeric-001";
const CALC_QUALITATIVE_ID = "calc-qual-001";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[àáâã]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõ]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function nameToEmail(fullName: string): string {
  // Excel format: "Cognome Nome" or "Cognome Nome Secondo"
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return `${slugify(parts[0])}@24ore.com`;
  const cognome = slugify(parts[0]);
  const nome = slugify(parts.slice(1).join("."));
  return `${nome}.${cognome}@24ore.com`;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    lastName: parts[0],
    firstName: parts.slice(1).join(" "),
  };
}

function normalizeCode(code: string | null | undefined): string {
  if (!code) return "";
  return code.trim().replace(/[\s\-]+$/, "").trim();
}

function parsePercent(val: string | null | undefined): number | null {
  if (!val) return null;
  const n = parseFloat(String(val).replace("%", "").replace(",", ".").trim());
  return isNaN(n) ? null : Math.round(n);
}

function parseNumeric(val: string | null | undefined): number | null {
  if (!val) return null;
  const cleaned = String(val).replace(/\./g, "").replace(",", ".").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function isNumericTarget(val: string | null | undefined): boolean {
  if (!val) return false;
  const cleaned = String(val).replace(/[\.,\s]/g, "");
  return /^\d+$/.test(cleaned);
}

function isQualitativeConsuntivo(val: string | null | undefined): boolean {
  if (!val) return false;
  return isNaN(Number(String(val).replace(/[\.,\s]/g, "")));
}

function clusterIdForType(tipoObiettivo: string): string {
  const t = tipoObiettivo.toUpperCase();
  if (t.includes("GRUPPO")) return CLUSTER_GRUPPO_ID;
  if (t.includes("ESG")) return CLUSTER_ESG_ID;
  return CLUSTER_PERFORMANCE_ID;
}

// ─── Row type ─────────────────────────────────────────────────────────────────

interface Row {
  id: string;
  beneficiario: string;
  area: string;
  tipoObiettivo: string;
  codice: string;
  indicatore: string;
  peso: string;
  target: string;
  rendicontatore: string;
  referente: string;
  consuntivo: string | null;
  percentualeRaggiungimento: string | null;
  pesoEffettivo: string | null;
  noteArea: string | null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Lettura Excel...");
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });

  const headers = rawRows[0] as string[];
  console.log("Colonne:", headers);

  const rows: Row[] = rawRows.slice(1).map((r: any[]) => ({
    id: String(r[0] ?? ""),
    beneficiario: String(r[1] ?? "").trim(),
    area: String(r[2] ?? "").trim(),
    tipoObiettivo: String(r[3] ?? "").trim(),
    codice: String(r[4] ?? "").trim(),
    indicatore: String(r[5] ?? "").trim(),
    peso: String(r[6] ?? "").trim(),
    target: String(r[7] ?? "").trim(),
    rendicontatore: String(r[8] ?? "").trim(),
    referente: String(r[9] ?? "").trim(),
    consuntivo: r[10] != null ? String(r[10]).trim() : null,
    percentualeRaggiungimento: r[11] != null ? String(r[11]).trim() : null,
    pesoEffettivo: r[12] != null ? String(r[12]).trim() : null,
    noteArea: r[13] != null ? String(r[13]).trim() : null,
  })).filter(r => r.beneficiario && r.indicatore);

  console.log(`Righe valide: ${rows.length}`);

  // ─── 1. Collect all people ────────────────────────────────────────────────

  const allPeople = new Map<string, { email: string; firstName: string; lastName: string; department: string; isRendicontatore: boolean }>();

  for (const row of rows) {
    if (!allPeople.has(row.beneficiario)) {
      const { firstName, lastName } = splitName(row.beneficiario);
      allPeople.set(row.beneficiario, {
        email: nameToEmail(row.beneficiario),
        firstName,
        lastName,
        department: row.area,
        isRendicontatore: false,
      });
    }
  }

  // Referenti che non sono beneficiari
  for (const row of rows) {
    if (row.referente && !allPeople.has(row.referente)) {
      const { firstName, lastName } = splitName(row.referente);
      allPeople.set(row.referente, {
        email: nameToEmail(row.referente),
        firstName,
        lastName,
        department: "",
        isRendicontatore: true,
      });
    }
  }

  console.log(`Persone totali: ${allPeople.size}`);

  // ─── 2. Insert clusters ───────────────────────────────────────────────────

  await db.insert(indicatorClusters).values([
    { id: CLUSTER_GRUPPO_ID, name: "Obiettivi di Gruppo" },
    { id: CLUSTER_PERFORMANCE_ID, name: "Obiettivi di Performance" },
    { id: CLUSTER_ESG_ID, name: "Obiettivi ESG" },
  ]).onConflictDoNothing();
  console.log("Cluster inseriti.");

  // ─── 3. Insert calculation types ─────────────────────────────────────────

  await db.insert(calculationTypes).values([
    { id: CALC_NUMERIC_ID, name: "Numerico", description: "Interpolazione lineare su valore numerico", formula: "linear_interpolation" },
    { id: CALC_QUALITATIVE_ID, name: "Qualitativo", description: "Raggiunto / Non raggiunto", formula: "binary" },
  ]).onConflictDoNothing();
  console.log("Tipi calcolo inseriti.");

  // ─── 4. Insert users ──────────────────────────────────────────────────────

  const usersData = Array.from(allPeople.entries()).map(([fullName, p]) => ({
    id: `usr-${slugify(fullName)}`,
    email: p.email,
    firstName: p.firstName,
    lastName: p.lastName,
    department: p.department || null,
    role: "employee" as const,
    isRendicontatore: p.isRendicontatore,
    isActive: true,
    beneficiaryType: "standard" as const,
  }));

  await db.insert(users).values(usersData).onConflictDoNothing();
  console.log(`Utenti inseriti: ${usersData.length}`);

  // Build name → user id map
  const userIdMap = new Map<string, string>();
  for (const u of usersData) {
    const fullName = `${u.lastName} ${u.firstName}`.trim();
    userIdMap.set(fullName, u.id);
  }

  // ─── 5. Build objectives dictionary ──────────────────────────────────────
  // Obiettivi di gruppo (A1-A3): shared, dedup by normalized codice
  // Obiettivi individuali (B, C): one per row

  interface DictEntry {
    id: string;
    title: string;
    indicatorClusterId: string;
    calculationTypeId: string;
    objectiveType: "numeric" | "qualitative";
    targetValue: number | null;
    targetDescription: string | null;
    dataSource: string | null;
    actualValue: number | null;
    qualitativeResult: string | null;
  }

  const dictMap = new Map<string, DictEntry>(); // key → entry

  for (const row of rows) {
    const code = normalizeCode(row.codice);
    const clusterId = clusterIdForType(row.tipoObiettivo);

    // Dedup by (codice_normalizzato, indicatore) for ALL objectives — same text = same objective
    const dictKey = `${code}::${row.indicatore.trim()}`;

    if (!dictMap.has(dictKey)) {
      const numeric = isNumericTarget(row.target);
      const calcType = numeric ? CALC_NUMERIC_ID : CALC_QUALITATIVE_ID;
      const objType: "numeric" | "qualitative" = numeric ? "numeric" : "qualitative";

      let actualValue: number | null = null;
      let qualResult: string | null = null;

      if (row.consuntivo) {
        if (objType === "numeric" && !isQualitativeConsuntivo(row.consuntivo)) {
          actualValue = parseNumeric(row.consuntivo);
        } else {
          // Qualitative: determine reached/not_reached from percentuale
          const pct = parsePercent(row.percentualeRaggiungimento);
          if (pct !== null) {
            qualResult = pct >= 100 ? "reached" : pct > 0 ? "reached" : "not_reached";
          }
        }
      }

      dictMap.set(dictKey, {
        id: `dict-${dictKey}`,
        title: row.indicatore,
        indicatorClusterId: clusterId,
        calculationTypeId: calcType,
        objectiveType: objType,
        targetValue: numeric ? parseNumeric(row.target) : null,
        targetDescription: !numeric ? row.target : null,
        dataSource: row.rendicontatore || null,
        actualValue,
        qualitativeResult: qualResult,
      });
    }
  }

  const dictEntries = Array.from(dictMap.values());
  await db.insert(objectivesDictionary).values(dictEntries).onConflictDoNothing();
  console.log(`Dizionario obiettivi inseriti: ${dictEntries.length}`);

  // ─── 6. Build objectives instances ───────────────────────────────────────

  interface ObjEntry {
    id: string;
    dictionaryId: string;
    clusterId: string;
    actualValue: number | null;
    qualitativeResult: "reached" | "not_reached" | null;
  }

  // One objective instance per dictionary entry (shared for gruppo, unique for individual)
  const objMap = new Map<string, ObjEntry>(); // dictKey → objective

  for (const [dictKey, dict] of dictMap.entries()) {
    objMap.set(dictKey, {
      id: `obj-${dictKey}`,
      dictionaryId: dict.id,
      clusterId: dict.indicatorClusterId,
      actualValue: dict.actualValue,
      qualitativeResult: dict.qualitativeResult as "reached" | "not_reached" | null,
    });
  }

  const objEntries = Array.from(objMap.values());
  await db.insert(objectives).values(objEntries).onConflictDoNothing();
  console.log(`Obiettivi (istanze) inseriti: ${objEntries.length}`);

  // ─── 7. Build assignments ─────────────────────────────────────────────────

  interface AssignEntry {
    id: string;
    userId: string;
    objectiveId: string;
    weight: number;
    status: string;
    progress: number;
  }

  const assignments: AssignEntry[] = [];
  const seen = new Set<string>(); // userId+objectiveId dedup

  for (const row of rows) {
    const userId = userIdMap.get(row.beneficiario);
    if (!userId) {
      console.warn(`Utente non trovato: ${row.beneficiario}`);
      continue;
    }

    const code = normalizeCode(row.codice);
    const dictKey = `${code}::${row.indicatore.trim()}`;
    const objectiveId = `obj-${dictKey}`;

    const dedupeKey = `${userId}::${objectiveId}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const weight = parsePercent(row.peso) ?? 0;
    const progress = parsePercent(row.percentualeRaggiungimento) ?? 0;
    const hasConsuntivo = row.consuntivo !== null;
    const status = hasConsuntivo ? "completato" : "assegnato";

    assignments.push({
      id: `asgn-${row.id}`,
      userId,
      objectiveId,
      weight,
      status,
      progress,
    });
  }

  await db.insert(objectiveAssignments).values(assignments).onConflictDoNothing();
  console.log(`Assegnazioni inserite: ${assignments.length}`);

  console.log("\n✓ Import completato.");
  console.log(`  Utenti:       ${usersData.length}`);
  console.log(`  Cluster:      3`);
  console.log(`  Dizionario:   ${dictEntries.length}`);
  console.log(`  Obiettivi:    ${objEntries.length}`);
  console.log(`  Assegnazioni: ${assignments.length}`);
}

main().catch(err => {
  console.error("Errore import:", err);
  process.exit(1);
});
