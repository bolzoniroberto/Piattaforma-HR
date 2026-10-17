import jwt from "jsonwebtoken";
import { sendMail } from "./mail/mailProvider";
import { esc, infoRow, renderEmail } from "./mail/templates";

const JWT_SECRET = process.env.JWT_SECRET || "mbo-reporting-secret-change-in-production";
const TOKEN_EXPIRY = "30d";

// ─── Token helpers ────────────────────────────────────────────────────────────

export function generateReportingToken(dictionaryId: string): string {
  return jwt.sign({ dictionaryId, type: "reporting" }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyReportingToken(token: string): { dictionaryId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { dictionaryId: string; type: string };
    if (payload.type !== "reporting") return null;
    return { dictionaryId: payload.dictionaryId };
  } catch {
    return null;
  }
}

// ─── Reporting request ────────────────────────────────────────────────────────

export interface ReportingEmailData {
  dictionaryTitle: string;
  targetValue?: number | null;
  dataSource?: string | null;
  objectiveType: string;
  token: string;
  baseUrl: string;
}

export async function sendReportingRequestEmail(to: string, data: ReportingEmailData): Promise<void> {
  const link = `${data.baseUrl}/r/${data.token}`;

  const html = renderEmail({
    badge: "Richiesta Rendicontazione MBO",
    title: "Inserisci il consuntivo",
    bodyHtml: `
      <p class="lead">Ti chiediamo di fornire il dato consuntivo per il seguente obiettivo MBO. Clicca il pulsante per accedere al form sicuro.</p>
      ${infoRow("Obiettivo", data.dictionaryTitle)}
      ${data.dataSource ? infoRow("Fonte dati", data.dataSource) : ""}
      ${data.targetValue != null ? infoRow("Target", data.targetValue) : ""}
      ${infoRow("Tipo obiettivo", data.objectiveType === "numeric" ? "Quantitativo" : "Qualitativo")}`,
    cta: { label: "Rendiconta ora →", url: link },
    note: "Il link è valido per 30 giorni e può essere utilizzato una sola volta. Se non sei il destinatario corretto, ignora questa email.",
    showUrl: true,
  });

  await sendMail({ to, subject: `Richiesta rendicontazione MBO: ${data.dictionaryTitle}`, html });
}

// ─── Group email to data source ───────────────────────────────────────────────

export interface DataSourceGroupEmailData {
  contactName: string;
  objectives: Array<{
    title: string;
    objectiveType: string;
    targetValue?: number | null;
    targetDescription?: string | null;
    thresholdValue?: number | null;
    dataSource?: string | null;
  }>;
  adminContact?: string;
  year?: string;
}

export async function sendDataSourceGroupEmail(to: string, data: DataSourceGroupEmailData): Promise<void> {
  const year = data.year || new Date().getFullYear().toString();
  const cell = "padding:10px 12px;border-bottom:1px solid #f1f5f9;";

  const objectiveRows = data.objectives.map((obj) => {
    const tipo = obj.objectiveType === "numeric" ? "Quantitativo" : "Qualitativo";
    const target = obj.objectiveType === "numeric" && obj.targetValue != null
      ? obj.targetValue.toLocaleString("it-IT")
      : "—";
    return `
      <tr>
        <td style="${cell}font-size:14px;font-weight:500;">${esc(obj.title)}</td>
        <td style="${cell}font-size:13px;color:#64748b;">${tipo}</td>
        <td style="${cell}font-size:13px;text-align:right;">${esc(target)}</td>
        <td style="${cell}font-size:13px;color:#64748b;">${esc(obj.targetDescription || "—")}</td>
      </tr>`;
  }).join("");

  const adminReplyLine = data.adminContact
    ? `<p class="lead">Per comunicarci i dati, rispondi direttamente a questa email o scrivi a <strong>${esc(data.adminContact)}</strong>.</p>`
    : `<p class="lead">Per comunicarci i dati, rispondi direttamente a questa email.</p>`;

  const html = renderEmail({
    badge: `Richiesta Rendicontazione MBO ${year}`,
    title: "Comunicazione dati consuntivi",
    width: 640,
    bodyHtml: `
      <p class="lead">Gentile ${esc(data.contactName || "collega")},<br><br>
      sei indicata/o come fonte dati per i seguenti obiettivi MBO ${esc(year)}. Ti chiediamo di comunicarci i valori consuntivi a tua disposizione rispondendo a questa email o contattando il referente amministrativo.</p>
      <table>
        <thead>
          <tr><th>Obiettivo</th><th>Tipo</th><th style="text-align:right;">Target</th><th>Descrizione target</th></tr>
        </thead>
        <tbody>${objectiveRows}</tbody>
      </table>
      ${adminReplyLine}`,
    note: "Questa è una comunicazione automatica della piattaforma MBO. Se non sei il destinatario corretto o ritieni di aver ricevuto questa email per errore, contatta l'amministratore.",
  });

  await sendMail({
    to,
    subject: `Richiesta dati consuntivi MBO ${year} — ${data.objectives.length} obiettiv${data.objectives.length === 1 ? "o" : "i"}`,
    html,
  });
}
