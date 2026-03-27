import "dotenv/config";
import { db } from "../server/db";
import {
  users,
  persona,
  contatti,
  organizzazione,
  contratti,
  compensation,
  ruoli,
  sedi,
  ccnl,
  livelliContrattuali,
  causaliAssunzione,
  configurazioniOrario,
  indicatorClusters,
  calculationTypes,
  objectivesDictionary,
  objectives,
  objectiveAssignments,
  mboRegulationAcceptances,
} from "../shared/schema";

// ─── Utility ────────────────────────────────────────────────────────────────

function toUnix(dateStr: string): number {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

// ─── Lookup data ────────────────────────────────────────────────────────────

const SEDE_MILANO_ID = "sede-mi-001";
const SEDE_ROMA_ID = "sede-rm-001";
const CCNL_METALMECCANICO_ID = "ccnl-metalmec-001";
const CCNL_COMMERCIO_ID = "ccnl-commercio-001";
const CAUSALE_ASSUNZIONE_ID = "causale-001";
const ORARIO_GIORNALIERO_ID = "orario-giorn-001";
const ORARIO_TIMBRA_ID = "orario-timbra-001";

const LIV_Q1_ID = "liv-q1-001"; // Quadro 1
const LIV_Q2_ID = "liv-q2-001"; // Quadro 2
const LIV_IMP1_ID = "liv-imp1-001"; // Impiegato 1
const LIV_IMP2_ID = "liv-imp2-001"; // Impiegato 2
const LIV_IMP3_ID = "liv-imp3-001"; // Impiegato 3

// ─── Cluster & Calculation IDs ───────────────────────────────────────────────

const CLUSTER_GRUPPO_ID = "cluster-gruppo-001";
const CLUSTER_INDIVIDUALE_ID = "cluster-ind-001";
const CLUSTER_ESG_ID = "cluster-esg-001";

const CALC_LINEAR_ID = "calc-linear-001";
const CALC_BINARY_ID = "calc-binary-001";
const CALC_QUALITATIVE_ID = "calc-qual-001";

// ─── User IDs ────────────────────────────────────────────────────────────────

const ADMIN_ID = "user-admin-001";
const HR_ID = "user-hr-001";
const CEO_ID = "user-ceo-001";

// Managers (3)
const MGR_TECH_ID = "user-mgr-tech-001";
const MGR_SALES_ID = "user-mgr-sales-001";
const MGR_OPS_ID = "user-mgr-ops-001";

// Tech team (5)
const EMP_T1_ID = "user-emp-t1-001";
const EMP_T2_ID = "user-emp-t2-001";
const EMP_T3_ID = "user-emp-t3-001";
const EMP_T4_ID = "user-emp-t4-001";
const EMP_T5_ID = "user-emp-t5-001";

// Sales team (4)
const EMP_S1_ID = "user-emp-s1-001";
const EMP_S2_ID = "user-emp-s2-001";
const EMP_S3_ID = "user-emp-s3-001";
const EMP_S4_ID = "user-emp-s4-001";

// Operations team (4)
const EMP_O1_ID = "user-emp-o1-001";
const EMP_O2_ID = "user-emp-o2-001";
const EMP_O3_ID = "user-emp-o3-001";
const EMP_O4_ID = "user-emp-o4-001";

// CF (codici fiscali) per persona table
const CF: Record<string, string> = {
  [ADMIN_ID]: "RSSMRA80A01H501Z",
  [HR_ID]: "VRDLGI85M01H501X",
  [CEO_ID]: "BNCMRC75A01H501Y",
  [MGR_TECH_ID]: "FRRFNC82C01H501A",
  [MGR_SALES_ID]: "CNTGNN79E01H501B",
  [MGR_OPS_ID]: "LMPPTR77H01H501C",
  [EMP_T1_ID]: "BNCCLD90A01H501D",
  [EMP_T2_ID]: "MRTNDR88B01H501E",
  [EMP_T3_ID]: "PLLSRN92D01H501F",
  [EMP_T4_ID]: "GRNLRS91F01H501G",
  [EMP_T5_ID]: "TRRVCN89H01H501H",
  [EMP_S1_ID]: "CMPMRC86A01H501I",
  [EMP_S2_ID]: "FNTLSN93C01H501J",
  [EMP_S3_ID]: "NCRFNC87E01H501K",
  [EMP_S4_ID]: "DLVGNN94A01H501L",
  [EMP_O1_ID]: "GLLPTR85D01H501M",
  [EMP_O2_ID]: "MNTLGI90F01H501N",
  [EMP_O3_ID]: "SCNMRC88H01H501O",
  [EMP_O4_ID]: "RSSVCN91A01H501P",
};

const MAT: Record<string, string> = {
  [ADMIN_ID]: "MAT0001",
  [HR_ID]: "MAT0002",
  [CEO_ID]: "MAT0003",
  [MGR_TECH_ID]: "MAT0010",
  [MGR_SALES_ID]: "MAT0011",
  [MGR_OPS_ID]: "MAT0012",
  [EMP_T1_ID]: "MAT0020",
  [EMP_T2_ID]: "MAT0021",
  [EMP_T3_ID]: "MAT0022",
  [EMP_T4_ID]: "MAT0023",
  [EMP_T5_ID]: "MAT0024",
  [EMP_S1_ID]: "MAT0030",
  [EMP_S2_ID]: "MAT0031",
  [EMP_S3_ID]: "MAT0032",
  [EMP_S4_ID]: "MAT0033",
  [EMP_O1_ID]: "MAT0040",
  [EMP_O2_ID]: "MAT0041",
  [EMP_O3_ID]: "MAT0042",
  [EMP_O4_ID]: "MAT0043",
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting realistic demo seed...\n");

  // ── 1. Lookup tables ──────────────────────────────────────────────────────

  console.log("📍 Inserting sedi...");
  await db.insert(sedi).values([
    {
      id: SEDE_MILANO_ID,
      codiceSede: "MI-001",
      descrizioneSede: "Sede Milano - Direzionale",
      comune: "Milano",
      indirizzo: "Via Monte Napoleone 12",
      cap: "20121",
      provincia: "MI",
      isActive: true,
    },
    {
      id: SEDE_ROMA_ID,
      codiceSede: "RM-001",
      descrizioneSede: "Sede Roma - Uffici Sud",
      comune: "Roma",
      indirizzo: "Via del Corso 100",
      cap: "00186",
      provincia: "RM",
      isActive: true,
    },
  ]).onConflictDoNothing();

  console.log("📋 Inserting CCNL...");
  await db.insert(ccnl).values([
    {
      id: CCNL_METALMECCANICO_ID,
      codiceCcnl: "CCNL-MM",
      descrizioneCcnl: "CCNL Metalmeccanici",
      isActive: true,
    },
    {
      id: CCNL_COMMERCIO_ID,
      codiceCcnl: "CCNL-COM",
      descrizioneCcnl: "CCNL Commercio e Terziario",
      isActive: true,
    },
  ]).onConflictDoNothing();

  console.log("📊 Inserting livelli contrattuali...");
  await db.insert(livelliContrattuali).values([
    { id: LIV_Q1_ID, ccnlId: CCNL_METALMECCANICO_ID, codiceLivello: "Q1", descrizioneLivello: "Quadro di 1° livello", ordinamento: 1 },
    { id: LIV_Q2_ID, ccnlId: CCNL_METALMECCANICO_ID, codiceLivello: "Q2", descrizioneLivello: "Quadro di 2° livello", ordinamento: 2 },
    { id: LIV_IMP1_ID, ccnlId: CCNL_METALMECCANICO_ID, codiceLivello: "IMP1", descrizioneLivello: "Impiegato 1° livello", ordinamento: 3 },
    { id: LIV_IMP2_ID, ccnlId: CCNL_METALMECCANICO_ID, codiceLivello: "IMP2", descrizioneLivello: "Impiegato 2° livello", ordinamento: 4 },
    { id: LIV_IMP3_ID, ccnlId: CCNL_METALMECCANICO_ID, codiceLivello: "IMP3", descrizioneLivello: "Impiegato 3° livello", ordinamento: 5 },
  ]).onConflictDoNothing();

  console.log("📝 Inserting causali assunzione...");
  await db.insert(causaliAssunzione).values([
    { id: CAUSALE_ASSUNZIONE_ID, codice: "TI", descrizione: "Tempo Indeterminato", isActive: true },
    { id: "causale-002", codice: "TD", descrizione: "Tempo Determinato", isActive: true },
  ]).onConflictDoNothing();

  console.log("⏰ Inserting configurazioni orario...");
  await db.insert(configurazioniOrario).values([
    { id: ORARIO_GIORNALIERO_ID, codice: "ORD-GG", tipo: "tipo_orario", descrizione: "Orario giornaliero 8h", isActive: true },
    { id: ORARIO_TIMBRA_ID, codice: "TB-STD", tipo: "timbra_firma", descrizione: "Timbratura standard", isActive: true },
  ]).onConflictDoNothing();

  // ── 2. MBO setup ─────────────────────────────────────────────────────────

  console.log("🎯 Inserting indicator clusters...");
  await db.insert(indicatorClusters).values([
    { id: CLUSTER_GRUPPO_ID, name: "Obiettivi di Gruppo", description: "Obiettivi legati alla performance aziendale complessiva" },
    { id: CLUSTER_INDIVIDUALE_ID, name: "Obiettivi Individuali", description: "Obiettivi personali e di funzione" },
    { id: CLUSTER_ESG_ID, name: "ESG / Sostenibilità", description: "Obiettivi di sostenibilità ambientale e sociale" },
  ]).onConflictDoNothing();

  console.log("📐 Inserting calculation types...");
  await db.insert(calculationTypes).values([
    { id: CALC_LINEAR_ID, name: "Interpolazione lineare", description: "Calcolo proporzionale tra soglia e target", formula: "((actual - threshold) / (target - threshold)) * 100" },
    { id: CALC_BINARY_ID, name: "100% al target", description: "0% sotto soglia, 100% al raggiungimento del target", formula: "actual >= target ? 100 : 0" },
    { id: CALC_QUALITATIVE_ID, name: "Qualitativo", description: "Valutazione manuale: raggiunto / parziale / non raggiunto", formula: "manual_assessment" },
  ]).onConflictDoNothing();

  console.log("📚 Inserting objectives dictionary...");
  const OBJ_DICT_EBITDA_ID = "obj-dict-ebitda-001";
  const OBJ_DICT_REVENUE_ID = "obj-dict-revenue-001";
  const OBJ_DICT_NPS_ID = "obj-dict-nps-001";
  const OBJ_DICT_CHURN_ID = "obj-dict-churn-001";
  const OBJ_DICT_TECH_UPTIME_ID = "obj-dict-uptime-001";
  const OBJ_DICT_TECH_SPRINT_ID = "obj-dict-sprint-001";
  const OBJ_DICT_SALES_CONV_ID = "obj-dict-conv-001";
  const OBJ_DICT_ESG_CO2_ID = "obj-dict-co2-001";
  const OBJ_DICT_ESG_DIVERSITY_ID = "obj-dict-diversity-001";
  const OBJ_DICT_OPS_SLA_ID = "obj-dict-sla-001";

  await db.insert(objectivesDictionary).values([
    // Gruppo
    {
      id: OBJ_DICT_EBITDA_ID,
      title: "EBITDA Margin",
      description: "Margine EBITDA annuale sul fatturato consolidato",
      indicatorClusterId: CLUSTER_GRUPPO_ID,
      calculationTypeId: CALC_LINEAR_ID,
      objectiveType: "numeric",
      targetValue: 18.0,
      thresholdValue: 12.0,
    },
    {
      id: OBJ_DICT_REVENUE_ID,
      title: "Crescita Ricavi",
      description: "Crescita percentuale dei ricavi rispetto all'anno precedente",
      indicatorClusterId: CLUSTER_GRUPPO_ID,
      calculationTypeId: CALC_LINEAR_ID,
      objectiveType: "numeric",
      targetValue: 10.0,
      thresholdValue: 5.0,
    },
    // Individuali - Tech
    {
      id: OBJ_DICT_TECH_UPTIME_ID,
      title: "Uptime Sistemi",
      description: "Disponibilità dei sistemi critici (%)",
      indicatorClusterId: CLUSTER_INDIVIDUALE_ID,
      calculationTypeId: CALC_BINARY_ID,
      objectiveType: "numeric",
      targetValue: 99.9,
      thresholdValue: 99.0,
    },
    {
      id: OBJ_DICT_TECH_SPRINT_ID,
      title: "Completamento Sprint",
      description: "Percentuale di story points completati vs pianificati",
      indicatorClusterId: CLUSTER_INDIVIDUALE_ID,
      calculationTypeId: CALC_LINEAR_ID,
      objectiveType: "numeric",
      targetValue: 90.0,
      thresholdValue: 70.0,
    },
    // Individuali - Sales
    {
      id: OBJ_DICT_SALES_CONV_ID,
      title: "Tasso di Conversione Pipeline",
      description: "Percentuale di lead qualificati convertiti in contratti",
      indicatorClusterId: CLUSTER_INDIVIDUALE_ID,
      calculationTypeId: CALC_LINEAR_ID,
      objectiveType: "numeric",
      targetValue: 25.0,
      thresholdValue: 15.0,
    },
    {
      id: OBJ_DICT_NPS_ID,
      title: "Net Promoter Score (NPS)",
      description: "Soddisfazione clienti misurata tramite NPS survey",
      indicatorClusterId: CLUSTER_INDIVIDUALE_ID,
      calculationTypeId: CALC_LINEAR_ID,
      objectiveType: "numeric",
      targetValue: 45.0,
      thresholdValue: 25.0,
    },
    {
      id: OBJ_DICT_CHURN_ID,
      title: "Riduzione Churn Rate",
      description: "Riduzione del tasso di abbandono clienti rispetto all'anno precedente",
      indicatorClusterId: CLUSTER_INDIVIDUALE_ID,
      calculationTypeId: CALC_BINARY_ID,
      objectiveType: "qualitative",
    },
    // Ops
    {
      id: OBJ_DICT_OPS_SLA_ID,
      title: "Rispetto SLA Operativi",
      description: "Percentuale di ticket risolti entro i tempi SLA definiti",
      indicatorClusterId: CLUSTER_INDIVIDUALE_ID,
      calculationTypeId: CALC_LINEAR_ID,
      objectiveType: "numeric",
      targetValue: 95.0,
      thresholdValue: 85.0,
    },
    // ESG
    {
      id: OBJ_DICT_ESG_CO2_ID,
      title: "Riduzione Emissioni CO₂",
      description: "Riduzione emissioni di CO₂ scope 1+2 rispetto baseline",
      indicatorClusterId: CLUSTER_ESG_ID,
      calculationTypeId: CALC_LINEAR_ID,
      objectiveType: "numeric",
      targetValue: 15.0,
      thresholdValue: 5.0,
    },
    {
      id: OBJ_DICT_ESG_DIVERSITY_ID,
      title: "Piano D&I",
      description: "Implementazione iniziative Diversity & Inclusion previste dal piano annuale",
      indicatorClusterId: CLUSTER_ESG_ID,
      calculationTypeId: CALC_QUALITATIVE_ID,
      objectiveType: "qualitative",
    },
  ]).onConflictDoNothing();

  // ── 3. Users ──────────────────────────────────────────────────────────────

  console.log("👤 Inserting users...");

  type UserRow = typeof users.$inferInsert;

  const usersData: UserRow[] = [
    // Admin
    {
      id: ADMIN_ID,
      email: "admin@azienda.it",
      firstName: "Mario",
      lastName: "Rossi",
      codiceFiscale: CF[ADMIN_ID],
      matricola: MAT[ADMIN_ID],
      role: "admin",
      department: "IT",
      cdc: "CDC-IT",
      ral: 65000,
      mboPercentage: 15,
      isActive: true,
    },
    // HR
    {
      id: HR_ID,
      email: "hr@azienda.it",
      firstName: "Laura",
      lastName: "Verdi",
      codiceFiscale: CF[HR_ID],
      matricola: MAT[HR_ID],
      role: "hr",
      department: "HR",
      cdc: "CDC-HR",
      ral: 62000,
      mboPercentage: 0,
      isActive: true,
    },
    // CEO
    {
      id: CEO_ID,
      email: "ceo@azienda.it",
      firstName: "Marco",
      lastName: "Bianchi",
      codiceFiscale: CF[CEO_ID],
      matricola: MAT[CEO_ID],
      role: "employee",
      department: "Direzione",
      cdc: "CDC-DIR",
      ral: 180000,
      mboPercentage: 30,
      isActive: true,
    },
    // Managers
    {
      id: MGR_TECH_ID,
      email: "tech.manager@azienda.it",
      firstName: "Francesco",
      lastName: "Ferrari",
      codiceFiscale: CF[MGR_TECH_ID],
      matricola: MAT[MGR_TECH_ID],
      role: "employee",
      department: "Technology",
      cdc: "CDC-TECH",
      managerId: CEO_ID,
      ral: 105000,
      mboPercentage: 25,
      isActive: true,
    },
    {
      id: MGR_SALES_ID,
      email: "sales.manager@azienda.it",
      firstName: "Giovanni",
      lastName: "Conti",
      codiceFiscale: CF[MGR_SALES_ID],
      matricola: MAT[MGR_SALES_ID],
      role: "employee",
      department: "Sales",
      cdc: "CDC-SALES",
      managerId: CEO_ID,
      ral: 110000,
      mboPercentage: 25,
      isActive: true,
    },
    {
      id: MGR_OPS_ID,
      email: "ops.manager@azienda.it",
      firstName: "Pietro",
      lastName: "Lampugnani",
      codiceFiscale: CF[MGR_OPS_ID],
      matricola: MAT[MGR_OPS_ID],
      role: "employee",
      department: "Operations",
      cdc: "CDC-OPS",
      managerId: CEO_ID,
      ral: 95000,
      mboPercentage: 20,
      isActive: true,
    },
    // Tech team
    {
      id: EMP_T1_ID,
      email: "claudio.benci@azienda.it",
      firstName: "Claudio",
      lastName: "Benci",
      codiceFiscale: CF[EMP_T1_ID],
      matricola: MAT[EMP_T1_ID],
      role: "employee",
      department: "Technology",
      cdc: "CDC-TECH",
      managerId: MGR_TECH_ID,
      ral: 72000,
      mboPercentage: 15,
      isActive: true,
    },
    {
      id: EMP_T2_ID,
      email: "andrea.martini@azienda.it",
      firstName: "Andrea",
      lastName: "Martini",
      codiceFiscale: CF[EMP_T2_ID],
      matricola: MAT[EMP_T2_ID],
      role: "employee",
      department: "Technology",
      cdc: "CDC-TECH",
      managerId: MGR_TECH_ID,
      ral: 68000,
      mboPercentage: 15,
      isActive: true,
    },
    {
      id: EMP_T3_ID,
      email: "sara.pollini@azienda.it",
      firstName: "Sara",
      lastName: "Pollini",
      codiceFiscale: CF[EMP_T3_ID],
      matricola: MAT[EMP_T3_ID],
      role: "employee",
      department: "Technology",
      cdc: "CDC-TECH",
      managerId: MGR_TECH_ID,
      ral: 70000,
      mboPercentage: 15,
      isActive: true,
    },
    {
      id: EMP_T4_ID,
      email: "luca.grani@azienda.it",
      firstName: "Luca",
      lastName: "Grani",
      codiceFiscale: CF[EMP_T4_ID],
      matricola: MAT[EMP_T4_ID],
      role: "employee",
      department: "Technology",
      cdc: "CDC-TECH",
      managerId: MGR_TECH_ID,
      ral: 65000,
      mboPercentage: 10,
      isActive: true,
    },
    {
      id: EMP_T5_ID,
      email: "vincenzo.torrisi@azienda.it",
      firstName: "Vincenzo",
      lastName: "Torrisi",
      codiceFiscale: CF[EMP_T5_ID],
      matricola: MAT[EMP_T5_ID],
      role: "employee",
      department: "Technology",
      cdc: "CDC-TECH",
      managerId: MGR_TECH_ID,
      ral: 63000,
      mboPercentage: 10,
      isActive: true,
    },
    // Sales team
    {
      id: EMP_S1_ID,
      email: "marco.campo@azienda.it",
      firstName: "Marco",
      lastName: "Campo",
      codiceFiscale: CF[EMP_S1_ID],
      matricola: MAT[EMP_S1_ID],
      role: "employee",
      department: "Sales",
      cdc: "CDC-SALES",
      managerId: MGR_SALES_ID,
      ral: 78000,
      mboPercentage: 20,
      isActive: true,
    },
    {
      id: EMP_S2_ID,
      email: "elisa.fontana@azienda.it",
      firstName: "Elisa",
      lastName: "Fontana",
      codiceFiscale: CF[EMP_S2_ID],
      matricola: MAT[EMP_S2_ID],
      role: "employee",
      department: "Sales",
      cdc: "CDC-SALES",
      managerId: MGR_SALES_ID,
      ral: 74000,
      mboPercentage: 20,
      isActive: true,
    },
    {
      id: EMP_S3_ID,
      email: "franco.nicotra@azienda.it",
      firstName: "Franco",
      lastName: "Nicotra",
      codiceFiscale: CF[EMP_S3_ID],
      matricola: MAT[EMP_S3_ID],
      role: "employee",
      department: "Sales",
      cdc: "CDC-SALES",
      managerId: MGR_SALES_ID,
      ral: 72000,
      mboPercentage: 20,
      isActive: true,
    },
    {
      id: EMP_S4_ID,
      email: "giulia.dalvit@azienda.it",
      firstName: "Giulia",
      lastName: "Dal Vit",
      codiceFiscale: CF[EMP_S4_ID],
      matricola: MAT[EMP_S4_ID],
      role: "employee",
      department: "Sales",
      cdc: "CDC-SALES",
      managerId: MGR_SALES_ID,
      ral: 69000,
      mboPercentage: 15,
      isActive: true,
    },
    // Operations team
    {
      id: EMP_O1_ID,
      email: "pietro.gallo@azienda.it",
      firstName: "Pietro",
      lastName: "Gallo",
      codiceFiscale: CF[EMP_O1_ID],
      matricola: MAT[EMP_O1_ID],
      role: "employee",
      department: "Operations",
      cdc: "CDC-OPS",
      managerId: MGR_OPS_ID,
      ral: 62000,
      mboPercentage: 10,
      isActive: true,
    },
    {
      id: EMP_O2_ID,
      email: "luigi.montani@azienda.it",
      firstName: "Luigi",
      lastName: "Montani",
      codiceFiscale: CF[EMP_O2_ID],
      matricola: MAT[EMP_O2_ID],
      role: "employee",
      department: "Operations",
      cdc: "CDC-OPS",
      managerId: MGR_OPS_ID,
      ral: 60000,
      mboPercentage: 10,
      isActive: true,
    },
    {
      id: EMP_O3_ID,
      email: "marco.scanno@azienda.it",
      firstName: "Marco",
      lastName: "Scanno",
      codiceFiscale: CF[EMP_O3_ID],
      matricola: MAT[EMP_O3_ID],
      role: "employee",
      department: "Operations",
      cdc: "CDC-OPS",
      managerId: MGR_OPS_ID,
      ral: 58000,
      mboPercentage: 10,
      isActive: true,
    },
    {
      id: EMP_O4_ID,
      email: "vincenza.russo@azienda.it",
      firstName: "Vincenza",
      lastName: "Russo",
      codiceFiscale: CF[EMP_O4_ID],
      matricola: MAT[EMP_O4_ID],
      role: "employee",
      department: "Operations",
      cdc: "CDC-OPS",
      managerId: MGR_OPS_ID,
      ral: 57000,
      mboPercentage: 10,
      isActive: true,
    },
  ];

  await db.insert(users).values(usersData).onConflictDoNothing();

  // ── 4. Persona anagrafica ─────────────────────────────────────────────────

  console.log("🧑 Inserting persona anagrafica...");

  const personaData = [
    { id: ADMIN_ID, cognome: "Rossi", nome: "Mario", sesso: "M" },
    { id: HR_ID, cognome: "Verdi", nome: "Laura", sesso: "F" },
    { id: CEO_ID, cognome: "Bianchi", nome: "Marco", sesso: "M" },
    { id: MGR_TECH_ID, cognome: "Ferrari", nome: "Francesco", sesso: "M" },
    { id: MGR_SALES_ID, cognome: "Conti", nome: "Giovanni", sesso: "M" },
    { id: MGR_OPS_ID, cognome: "Lampugnani", nome: "Pietro", sesso: "M" },
    { id: EMP_T1_ID, cognome: "Benci", nome: "Claudio", sesso: "M" },
    { id: EMP_T2_ID, cognome: "Martini", nome: "Andrea", sesso: "M" },
    { id: EMP_T3_ID, cognome: "Pollini", nome: "Sara", sesso: "F" },
    { id: EMP_T4_ID, cognome: "Grani", nome: "Luca", sesso: "M" },
    { id: EMP_T5_ID, cognome: "Torrisi", nome: "Vincenzo", sesso: "M" },
    { id: EMP_S1_ID, cognome: "Campo", nome: "Marco", sesso: "M" },
    { id: EMP_S2_ID, cognome: "Fontana", nome: "Elisa", sesso: "F" },
    { id: EMP_S3_ID, cognome: "Nicotra", nome: "Franco", sesso: "M" },
    { id: EMP_S4_ID, cognome: "Dal Vit", nome: "Giulia", sesso: "F" },
    { id: EMP_O1_ID, cognome: "Gallo", nome: "Pietro", sesso: "M" },
    { id: EMP_O2_ID, cognome: "Montani", nome: "Luigi", sesso: "M" },
    { id: EMP_O3_ID, cognome: "Scanno", nome: "Marco", sesso: "M" },
    { id: EMP_O4_ID, cognome: "Russo", nome: "Vincenza", sesso: "F" },
  ];

  await db.insert(persona).values(
    personaData.map(p => ({
      codiceFiscale: CF[p.id],
      matricola: MAT[p.id],
      cognome: p.cognome,
      nome: p.nome,
      sesso: p.sesso,
      cittadinanza: "ITA",
    }))
  ).onConflictDoNothing();

  // ── 5. Contatti ───────────────────────────────────────────────────────────

  console.log("📞 Inserting contatti...");

  type ContattiRow = typeof contatti.$inferInsert;
  const emails: Record<string, string> = {
    [ADMIN_ID]: "admin@azienda.it",
    [HR_ID]: "hr@azienda.it",
    [CEO_ID]: "ceo@azienda.it",
    [MGR_TECH_ID]: "tech.manager@azienda.it",
    [MGR_SALES_ID]: "sales.manager@azienda.it",
    [MGR_OPS_ID]: "ops.manager@azienda.it",
    [EMP_T1_ID]: "claudio.benci@azienda.it",
    [EMP_T2_ID]: "andrea.martini@azienda.it",
    [EMP_T3_ID]: "sara.pollini@azienda.it",
    [EMP_T4_ID]: "luca.grani@azienda.it",
    [EMP_T5_ID]: "vincenzo.torrisi@azienda.it",
    [EMP_S1_ID]: "marco.campo@azienda.it",
    [EMP_S2_ID]: "elisa.fontana@azienda.it",
    [EMP_S3_ID]: "franco.nicotra@azienda.it",
    [EMP_S4_ID]: "giulia.dalvit@azienda.it",
    [EMP_O1_ID]: "pietro.gallo@azienda.it",
    [EMP_O2_ID]: "luigi.montani@azienda.it",
    [EMP_O3_ID]: "marco.scanno@azienda.it",
    [EMP_O4_ID]: "vincenza.russo@azienda.it",
  };

  const phones: Record<string, string> = {
    [CEO_ID]: "+39 02 1234567",
    [MGR_TECH_ID]: "+39 02 2345678",
    [MGR_SALES_ID]: "+39 02 3456789",
    [MGR_OPS_ID]: "+39 02 4567890",
  };

  const allUserIds = [ADMIN_ID, HR_ID, CEO_ID, MGR_TECH_ID, MGR_SALES_ID, MGR_OPS_ID,
    EMP_T1_ID, EMP_T2_ID, EMP_T3_ID, EMP_T4_ID, EMP_T5_ID,
    EMP_S1_ID, EMP_S2_ID, EMP_S3_ID, EMP_S4_ID,
    EMP_O1_ID, EMP_O2_ID, EMP_O3_ID, EMP_O4_ID];

  await db.insert(contatti).values(
    allUserIds.map((uid): ContattiRow => ({
      codiceFiscale: CF[uid],
      email: emails[uid],
      telefono: phones[uid] ?? null,
      citta: [CEO_ID, MGR_SALES_ID, EMP_S1_ID, EMP_S2_ID, EMP_S3_ID, EMP_S4_ID, EMP_O3_ID, EMP_O4_ID].includes(uid) ? "Roma" : "Milano",
    }))
  ).onConflictDoNothing();

  // ── 6. Organizzazione ─────────────────────────────────────────────────────

  console.log("🏢 Inserting organizzazione...");

  type OrgRow = typeof organizzazione.$inferInsert;

  const deptMap: Record<string, { l1: string; l2: string; l3: string; cdc: string; sede: string }> = {
    [ADMIN_ID]:    { l1: "DIR", l2: "DIR-IT",    l3: "DIR-IT-OPS",  cdc: "CDC-IT",    sede: SEDE_MILANO_ID },
    [HR_ID]:       { l1: "DIR", l2: "DIR-HR",    l3: "DIR-HR-ADM",  cdc: "CDC-HR",    sede: SEDE_MILANO_ID },
    [CEO_ID]:      { l1: "DIR", l2: "DIR-GEN",   l3: "DIR-GEN-CEO", cdc: "CDC-DIR",   sede: SEDE_ROMA_ID   },
    [MGR_TECH_ID]: { l1: "OPS", l2: "OPS-TECH",  l3: "OPS-TECH-MGR",cdc: "CDC-TECH",  sede: SEDE_MILANO_ID },
    [MGR_SALES_ID]:{ l1: "COM", l2: "COM-SALES", l3: "COM-SALES-MGR",cdc: "CDC-SALES", sede: SEDE_ROMA_ID   },
    [MGR_OPS_ID]:  { l1: "OPS", l2: "OPS-BACK",  l3: "OPS-BACK-MGR",cdc: "CDC-OPS",   sede: SEDE_MILANO_ID },
    [EMP_T1_ID]:   { l1: "OPS", l2: "OPS-TECH",  l3: "OPS-TECH-DEV",cdc: "CDC-TECH",  sede: SEDE_MILANO_ID },
    [EMP_T2_ID]:   { l1: "OPS", l2: "OPS-TECH",  l3: "OPS-TECH-DEV",cdc: "CDC-TECH",  sede: SEDE_MILANO_ID },
    [EMP_T3_ID]:   { l1: "OPS", l2: "OPS-TECH",  l3: "OPS-TECH-DEV",cdc: "CDC-TECH",  sede: SEDE_MILANO_ID },
    [EMP_T4_ID]:   { l1: "OPS", l2: "OPS-TECH",  l3: "OPS-TECH-INF",cdc: "CDC-TECH",  sede: SEDE_MILANO_ID },
    [EMP_T5_ID]:   { l1: "OPS", l2: "OPS-TECH",  l3: "OPS-TECH-INF",cdc: "CDC-TECH",  sede: SEDE_MILANO_ID },
    [EMP_S1_ID]:   { l1: "COM", l2: "COM-SALES", l3: "COM-SALES-ENT",cdc: "CDC-SALES", sede: SEDE_ROMA_ID   },
    [EMP_S2_ID]:   { l1: "COM", l2: "COM-SALES", l3: "COM-SALES-ENT",cdc: "CDC-SALES", sede: SEDE_ROMA_ID   },
    [EMP_S3_ID]:   { l1: "COM", l2: "COM-SALES", l3: "COM-SALES-SMB",cdc: "CDC-SALES", sede: SEDE_ROMA_ID   },
    [EMP_S4_ID]:   { l1: "COM", l2: "COM-SALES", l3: "COM-SALES-SMB",cdc: "CDC-SALES", sede: SEDE_ROMA_ID   },
    [EMP_O1_ID]:   { l1: "OPS", l2: "OPS-BACK",  l3: "OPS-BACK-SUP",cdc: "CDC-OPS",   sede: SEDE_MILANO_ID },
    [EMP_O2_ID]:   { l1: "OPS", l2: "OPS-BACK",  l3: "OPS-BACK-SUP",cdc: "CDC-OPS",   sede: SEDE_MILANO_ID },
    [EMP_O3_ID]:   { l1: "OPS", l2: "OPS-BACK",  l3: "OPS-BACK-LOG",cdc: "CDC-OPS",   sede: SEDE_ROMA_ID   },
    [EMP_O4_ID]:   { l1: "OPS", l2: "OPS-BACK",  l3: "OPS-BACK-LOG",cdc: "CDC-OPS",   sede: SEDE_ROMA_ID   },
  };

  await db.insert(organizzazione).values(
    allUserIds.map((uid): OrgRow => ({
      codiceFiscale: CF[uid],
      codiceAzienda: "AZI001",
      azienda: "Azienda Demo S.p.A.",
      codiceStrutturaL1: deptMap[uid].l1,
      descrizioneStrutturaL1: { DIR: "Direzione", OPS: "Operations", COM: "Commercial" }[deptMap[uid].l1]!,
      codiceStrutturaL2: deptMap[uid].l2,
      descrizioneStrutturaL2: deptMap[uid].l2,
      codiceStrutturaL3: deptMap[uid].l3,
      descrizioneStrutturaL3: deptMap[uid].l3,
      codiceCdc: deptMap[uid].cdc,
      descrizioneCdc: deptMap[uid].cdc,
      sedeId: deptMap[uid].sede,
      configurazioneOrarioId: ORARIO_GIORNALIERO_ID,
      configurazioneTimbraFirmaId: ORARIO_TIMBRA_ID,
    }))
  ).onConflictDoNothing();

  // ── 7. Contratti ──────────────────────────────────────────────────────────

  console.log("📄 Inserting contratti...");

  type ContrattoRow = typeof contratti.$inferInsert;

  const levelMap: Record<string, string> = {
    [CEO_ID]: LIV_Q1_ID,
    [MGR_TECH_ID]: LIV_Q1_ID,
    [MGR_SALES_ID]: LIV_Q1_ID,
    [MGR_OPS_ID]: LIV_Q2_ID,
    [EMP_T1_ID]: LIV_IMP1_ID,
    [EMP_T2_ID]: LIV_IMP1_ID,
    [EMP_T3_ID]: LIV_IMP1_ID,
    [EMP_T4_ID]: LIV_IMP2_ID,
    [EMP_T5_ID]: LIV_IMP2_ID,
    [EMP_S1_ID]: LIV_IMP1_ID,
    [EMP_S2_ID]: LIV_IMP1_ID,
    [EMP_S3_ID]: LIV_IMP2_ID,
    [EMP_S4_ID]: LIV_IMP2_ID,
    [EMP_O1_ID]: LIV_IMP2_ID,
    [EMP_O2_ID]: LIV_IMP2_ID,
    [EMP_O3_ID]: LIV_IMP3_ID,
    [EMP_O4_ID]: LIV_IMP3_ID,
    [ADMIN_ID]: LIV_IMP1_ID,
    [HR_ID]: LIV_IMP1_ID,
  };

  const jobTitles: Record<string, string> = {
    [CEO_ID]: "Chief Executive Officer",
    [MGR_TECH_ID]: "Head of Technology",
    [MGR_SALES_ID]: "Head of Sales",
    [MGR_OPS_ID]: "Operations Manager",
    [ADMIN_ID]: "System Administrator",
    [HR_ID]: "HR Business Partner",
    [EMP_T1_ID]: "Senior Software Engineer",
    [EMP_T2_ID]: "Software Engineer",
    [EMP_T3_ID]: "Frontend Developer",
    [EMP_T4_ID]: "DevOps Engineer",
    [EMP_T5_ID]: "Infrastructure Specialist",
    [EMP_S1_ID]: "Enterprise Account Executive",
    [EMP_S2_ID]: "Account Executive",
    [EMP_S3_ID]: "Sales Representative",
    [EMP_S4_ID]: "Sales Development Rep",
    [EMP_O1_ID]: "Operations Specialist",
    [EMP_O2_ID]: "Customer Support Lead",
    [EMP_O3_ID]: "Logistics Coordinator",
    [EMP_O4_ID]: "Back Office Specialist",
  };

  await db.insert(contratti).values(
    allUserIds.map((uid): ContrattoRow => ({
      codiceFiscale: CF[uid],
      matricola: MAT[uid],
      dataAssunzione: toUnix("2020-01-01"),
      codiceContratto: "TI",
      descrizioneContratto: "Tempo Indeterminato",
      causaleAssunzioneId: CAUSALE_ASSUNZIONE_ID,
      qualifica: "Impiegato",
      jobTitle: jobTitles[uid],
      ccnlId: CCNL_METALMECCANICO_ID,
      livelloContrattualeId: levelMap[uid],
      isActive: true,
    }))
  ).onConflictDoNothing();

  // ── 8. Compensation ───────────────────────────────────────────────────────

  console.log("💰 Inserting compensation...");

  type CompensationRow = typeof compensation.$inferInsert;

  const ralMap: Record<string, number> = {
    [CEO_ID]: 180000, [MGR_TECH_ID]: 105000, [MGR_SALES_ID]: 110000, [MGR_OPS_ID]: 95000,
    [ADMIN_ID]: 65000, [HR_ID]: 62000,
    [EMP_T1_ID]: 72000, [EMP_T2_ID]: 68000, [EMP_T3_ID]: 70000, [EMP_T4_ID]: 65000, [EMP_T5_ID]: 63000,
    [EMP_S1_ID]: 78000, [EMP_S2_ID]: 74000, [EMP_S3_ID]: 72000, [EMP_S4_ID]: 69000,
    [EMP_O1_ID]: 62000, [EMP_O2_ID]: 60000, [EMP_O3_ID]: 58000, [EMP_O4_ID]: 57000,
  };

  const mboMap: Record<string, number> = {
    [CEO_ID]: 30, [MGR_TECH_ID]: 25, [MGR_SALES_ID]: 25, [MGR_OPS_ID]: 20,
    [ADMIN_ID]: 0, [HR_ID]: 0,
    [EMP_T1_ID]: 15, [EMP_T2_ID]: 15, [EMP_T3_ID]: 15, [EMP_T4_ID]: 10, [EMP_T5_ID]: 10,
    [EMP_S1_ID]: 20, [EMP_S2_ID]: 20, [EMP_S3_ID]: 20, [EMP_S4_ID]: 15,
    [EMP_O1_ID]: 10, [EMP_O2_ID]: 10, [EMP_O3_ID]: 10, [EMP_O4_ID]: 10,
  };

  await db.insert(compensation).values(
    allUserIds
      .filter(uid => mboMap[uid] > 0)
      .map((uid): CompensationRow => ({
        codiceFiscale: CF[uid],
        ral: ralMap[uid],
        valuta: "EUR",
        mboPercentuale: mboMap[uid],
        mboTargetEuro: (ralMap[uid] * mboMap[uid]) / 100,
        validoDa: toUnix("2025-01-01"),
        isCurrent: true,
      }))
  ).onConflictDoNothing();

  // ── 9. Ruoli ──────────────────────────────────────────────────────────────

  console.log("👥 Inserting ruoli e gerarchia...");

  type RuoloRow = typeof ruoli.$inferInsert;

  const managerCfMap: Record<string, string | null> = {
    [CEO_ID]: null,
    [MGR_TECH_ID]: CF[CEO_ID],
    [MGR_SALES_ID]: CF[CEO_ID],
    [MGR_OPS_ID]: CF[CEO_ID],
    [EMP_T1_ID]: CF[MGR_TECH_ID],
    [EMP_T2_ID]: CF[MGR_TECH_ID],
    [EMP_T3_ID]: CF[MGR_TECH_ID],
    [EMP_T4_ID]: CF[MGR_TECH_ID],
    [EMP_T5_ID]: CF[MGR_TECH_ID],
    [EMP_S1_ID]: CF[MGR_SALES_ID],
    [EMP_S2_ID]: CF[MGR_SALES_ID],
    [EMP_S3_ID]: CF[MGR_SALES_ID],
    [EMP_S4_ID]: CF[MGR_SALES_ID],
    [EMP_O1_ID]: CF[MGR_OPS_ID],
    [EMP_O2_ID]: CF[MGR_OPS_ID],
    [EMP_O3_ID]: CF[MGR_OPS_ID],
    [EMP_O4_ID]: CF[MGR_OPS_ID],
    [ADMIN_ID]: null,
    [HR_ID]: null,
  };

  const systemRoles: Record<string, string> = {
    [ADMIN_ID]: "admin",
    [HR_ID]: "hr",
  };

  await db.insert(ruoli).values(
    allUserIds.map((uid): RuoloRow => ({
      codiceFiscale: CF[uid],
      responsabileDirettoCf: managerCfMap[uid] ?? null,
      reportsToCf: managerCfMap[uid] ?? null,
      role: systemRoles[uid] ?? "employee",
      isTns: false,
      isSgsl: false,
      isPrivacy: false,
    }))
  ).onConflictDoNothing();

  // ── 10. Objectives instances ──────────────────────────────────────────────

  console.log("🎯 Inserting objective instances...");

  type ObjectiveRow = typeof objectives.$inferInsert;

  const OBJ_EBITDA_ID = "obj-ebitda-2025";
  const OBJ_REVENUE_ID = "obj-revenue-2025";
  const OBJ_TECH_UPTIME_ID = "obj-uptime-2025";
  const OBJ_TECH_SPRINT_ID = "obj-sprint-2025";
  const OBJ_SALES_CONV_ID = "obj-conv-2025";
  const OBJ_NPS_ID = "obj-nps-2025";
  const OBJ_CHURN_ID = "obj-churn-2025";
  const OBJ_OPS_SLA_ID = "obj-sla-2025";
  const OBJ_ESG_CO2_ID = "obj-co2-2025";
  const OBJ_ESG_DIV_ID = "obj-diversity-2025";

  await db.insert(objectives).values([
    // Gruppo - reported (anno quasi finito)
    {
      id: OBJ_EBITDA_ID,
      dictionaryId: OBJ_DICT_EBITDA_ID,
      clusterId: CLUSTER_GRUPPO_ID,
      deadline: toUnix("2025-12-31"),
      actualValue: 15.3,
      reportedAt: toUnix("2026-01-15"),
    },
    {
      id: OBJ_REVENUE_ID,
      dictionaryId: OBJ_DICT_REVENUE_ID,
      clusterId: CLUSTER_GRUPPO_ID,
      deadline: toUnix("2025-12-31"),
      actualValue: 8.7,
      reportedAt: toUnix("2026-01-15"),
    },
    // Tech - mix di stati
    {
      id: OBJ_TECH_UPTIME_ID,
      dictionaryId: OBJ_DICT_TECH_UPTIME_ID,
      clusterId: CLUSTER_INDIVIDUALE_ID,
      deadline: toUnix("2025-12-31"),
      actualValue: 99.95,
      reportedAt: toUnix("2026-01-10"),
    },
    {
      id: OBJ_TECH_SPRINT_ID,
      dictionaryId: OBJ_DICT_TECH_SPRINT_ID,
      clusterId: CLUSTER_INDIVIDUALE_ID,
      deadline: toUnix("2025-12-31"),
      // Non ancora reportato
    },
    // Sales
    {
      id: OBJ_SALES_CONV_ID,
      dictionaryId: OBJ_DICT_SALES_CONV_ID,
      clusterId: CLUSTER_INDIVIDUALE_ID,
      deadline: toUnix("2025-12-31"),
      actualValue: 22.5,
      reportedAt: toUnix("2026-01-12"),
    },
    {
      id: OBJ_NPS_ID,
      dictionaryId: OBJ_DICT_NPS_ID,
      clusterId: CLUSTER_INDIVIDUALE_ID,
      deadline: toUnix("2025-12-31"),
      actualValue: 38,
      reportedAt: toUnix("2026-01-12"),
    },
    {
      id: OBJ_CHURN_ID,
      dictionaryId: OBJ_DICT_CHURN_ID,
      clusterId: CLUSTER_INDIVIDUALE_ID,
      deadline: toUnix("2025-12-31"),
      qualitativeResult: "partial",
      reportedAt: toUnix("2026-01-12"),
    },
    // Ops
    {
      id: OBJ_OPS_SLA_ID,
      dictionaryId: OBJ_DICT_OPS_SLA_ID,
      clusterId: CLUSTER_INDIVIDUALE_ID,
      deadline: toUnix("2025-12-31"),
      actualValue: 91.2,
      reportedAt: toUnix("2026-01-14"),
    },
    // ESG
    {
      id: OBJ_ESG_CO2_ID,
      dictionaryId: OBJ_DICT_ESG_CO2_ID,
      clusterId: CLUSTER_ESG_ID,
      deadline: toUnix("2025-12-31"),
      actualValue: 11.4,
      reportedAt: toUnix("2026-01-15"),
    },
    {
      id: OBJ_ESG_DIV_ID,
      dictionaryId: OBJ_DICT_ESG_DIVERSITY_ID,
      clusterId: CLUSTER_ESG_ID,
      deadline: toUnix("2025-12-31"),
      qualitativeResult: "reached",
      reportedAt: toUnix("2026-01-15"),
    },
  ] as ObjectiveRow[]).onConflictDoNothing();

  // ── 11. Objective Assignments ─────────────────────────────────────────────

  console.log("📌 Inserting objective assignments...");

  type AssignmentRow = typeof objectiveAssignments.$inferInsert;

  // MBO users (quelli con mboPercentage > 0)
  const mboUsers = [ADMIN_ID, CEO_ID, MGR_TECH_ID, MGR_SALES_ID, MGR_OPS_ID,
    EMP_T1_ID, EMP_T2_ID, EMP_T3_ID, EMP_T4_ID, EMP_T5_ID,
    EMP_S1_ID, EMP_S2_ID, EMP_S3_ID, EMP_S4_ID,
    EMP_O1_ID, EMP_O2_ID, EMP_O3_ID, EMP_O4_ID];

  const assignments: AssignmentRow[] = [];

  // Tutti gli MBO users hanno EBITDA + Revenue (obiettivi di gruppo, peso 30% totale)
  for (const uid of mboUsers) {
    assignments.push({
      userId: uid,
      objectiveId: OBJ_EBITDA_ID,
      weight: 15,
      status: "completato",
      progress: 100,
    });
    assignments.push({
      userId: uid,
      objectiveId: OBJ_REVENUE_ID,
      weight: 15,
      status: "completato",
      progress: 80,
    });
  }

  // ESG solo per manager e CEO (i senior employee sforerebbero 100%)
  const esgUsers = [CEO_ID, MGR_TECH_ID, MGR_SALES_ID, MGR_OPS_ID];
  for (const uid of esgUsers) {
    assignments.push({ userId: uid, objectiveId: OBJ_ESG_CO2_ID, weight: 10, status: "completato", progress: 100 });
    assignments.push({ userId: uid, objectiveId: OBJ_ESG_DIV_ID, weight: 10, status: "completato", progress: 100 });
  }

  // Admin individuali (IT: uptime + sprint)
  assignments.push({ userId: ADMIN_ID, objectiveId: OBJ_TECH_UPTIME_ID, weight: 45, status: "completato", progress: 100 });
  assignments.push({ userId: ADMIN_ID, objectiveId: OBJ_TECH_SPRINT_ID, weight: 25, status: "in_corso", progress: 60 });

  // Tech individuali
  const techEmps = [EMP_T1_ID, EMP_T2_ID, EMP_T3_ID, EMP_T4_ID, EMP_T5_ID];
  for (const uid of techEmps) {
    assignments.push({ userId: uid, objectiveId: OBJ_TECH_UPTIME_ID, weight: 35, status: "completato", progress: 100 });
    assignments.push({ userId: uid, objectiveId: OBJ_TECH_SPRINT_ID, weight: 25, status: "in_corso", progress: 65 });
  }
  assignments.push({ userId: MGR_TECH_ID, objectiveId: OBJ_TECH_UPTIME_ID, weight: 25, status: "completato", progress: 100 });
  assignments.push({ userId: MGR_TECH_ID, objectiveId: OBJ_TECH_SPRINT_ID, weight: 20, status: "in_corso", progress: 70 });

  // Sales individuali
  const salesEmps = [EMP_S1_ID, EMP_S2_ID, EMP_S3_ID, EMP_S4_ID];
  for (const uid of salesEmps) {
    assignments.push({ userId: uid, objectiveId: OBJ_SALES_CONV_ID, weight: 35, status: "completato", progress: 90 });
    assignments.push({ userId: uid, objectiveId: OBJ_NPS_ID, weight: 20, status: "completato", progress: 84 });
    assignments.push({ userId: uid, objectiveId: OBJ_CHURN_ID, weight: 15, status: "da_approvare", progress: 50 });
  }
  assignments.push({ userId: MGR_SALES_ID, objectiveId: OBJ_SALES_CONV_ID, weight: 30, status: "completato", progress: 90 });
  assignments.push({ userId: MGR_SALES_ID, objectiveId: OBJ_NPS_ID, weight: 15, status: "completato", progress: 84 });

  // Ops individuali
  const opsEmps = [EMP_O1_ID, EMP_O2_ID, EMP_O3_ID, EMP_O4_ID];
  for (const uid of opsEmps) {
    assignments.push({ userId: uid, objectiveId: OBJ_OPS_SLA_ID, weight: 55, status: "completato", progress: 96 });
  }
  assignments.push({ userId: MGR_OPS_ID, objectiveId: OBJ_OPS_SLA_ID, weight: 40, status: "completato", progress: 96 });

  // CEO + broader
  assignments.push({ userId: CEO_ID, objectiveId: OBJ_NPS_ID, weight: 10, status: "completato", progress: 84 });

  await db.insert(objectiveAssignments).values(assignments).onConflictDoNothing();

  // ── 12. MBO Regulation Acceptances ────────────────────────────────────────

  console.log("✅ Inserting MBO regulation acceptances...");

  // Tutti tranne EMP_T5 e EMP_O4 (per testare "non accettato")
  const acceptedUsers = mboUsers.filter(uid => uid !== EMP_T5_ID && uid !== EMP_O4_ID);
  await db.insert(mboRegulationAcceptances).values(
    acceptedUsers.map(uid => ({
      userId: uid,
      acceptedAt: toUnix("2025-01-15"),
    }))
  ).onConflictDoNothing();

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log("\n✅ Seed completato!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("CREDENZIALI DI ACCESSO:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Admin :  admin@azienda.it           (ruolo: admin)");
  console.log("  HR    :  hr@azienda.it              (ruolo: hr)");
  console.log("  CEO   :  ceo@azienda.it             (employee, MBO 30%)");
  console.log("  Tech  :  tech.manager@azienda.it    (manager, MBO 25%)");
  console.log("  Sales :  sales.manager@azienda.it   (manager, MBO 25%)");
  console.log("  Ops   :  ops.manager@azienda.it     (manager, MBO 20%)");
  console.log("  +13 dipendenti con obiettivi e pesi variabili");
  console.log("");
  console.log("  ⚠️  EMP Torrisi e Russo NON hanno accettato il regolamento MBO");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed fallito:", err);
  process.exit(1);
});
