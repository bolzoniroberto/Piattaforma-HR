import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

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

// ─── Email transporter ────────────────────────────────────────────────────────

function createTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });
}

// ─── Email template ───────────────────────────────────────────────────────────

export interface ReportingEmailData {
  dictionaryTitle: string;
  targetValue?: number | null;
  dataSource?: string | null;
  objectiveType: string;
  token: string;
  baseUrl: string;
}

export async function sendReportingRequestEmail(to: string, data: ReportingEmailData): Promise<void> {
  const transporter = createTransporter();
  const link = `${data.baseUrl}/r/${data.token}`;

  const html = `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><style>
  body { font-family: -apple-system, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
  .card { background: white; border-radius: 12px; padding: 32px; max-width: 560px; margin: 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .logo { font-weight: 800; font-size: 18px; color: #1e293b; margin-bottom: 24px; }
  .logo span { color: #4f46e5; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 8px; }
  .badge { display: inline-block; background: #ede9fe; color: #4f46e5; border-radius: 6px; padding: 3px 10px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
  .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  .info-row .label { color: #64748b; }
  .info-row .value { font-weight: 600; }
  .btn { display: block; background: #4f46e5; color: white !important; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; margin: 28px 0 16px; }
  .note { font-size: 12px; color: #94a3b8; line-height: 1.6; }
  .url-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 12px; word-break: break-all; color: #475569; margin-top: 12px; }
</style></head>
<body>
  <div class="card">
    <div class="logo">Talent<span>Hub</span></div>
    <div class="badge">Richiesta Rendicontazione MBO</div>
    <h1>Inserisci il consuntivo</h1>
    <p style="color:#64748b;font-size:14px;margin:0 0 20px">Ti chiediamo di fornire il dato consuntivo per il seguente obiettivo MBO. Clicca il pulsante per accedere al form sicuro.</p>

    <div class="info-row">
      <span class="label">Obiettivo</span>
      <span class="value">${data.dictionaryTitle}</span>
    </div>
    ${data.dataSource ? `<div class="info-row"><span class="label">Fonte dati</span><span class="value">${data.dataSource}</span></div>` : ""}
    ${data.targetValue != null ? `<div class="info-row"><span class="label">Target</span><span class="value">${data.targetValue}</span></div>` : ""}
    <div class="info-row">
      <span class="label">Tipo obiettivo</span>
      <span class="value">${data.objectiveType === "numeric" ? "Quantitativo" : "Qualitativo"}</span>
    </div>

    <a href="${link}" class="btn">Rendiconta ora →</a>

    <p class="note">Il link è valido per 30 giorni e può essere utilizzato una sola volta. Se non sei il destinatario corretto, ignora questa email.</p>
    <div class="url-box">${link}</div>
  </div>
</body>
</html>`;

  if (!transporter) {
    // Dev fallback: log to console instead of sending
    console.log(`[emailService] SMTP not configured. Would send to: ${to}`);
    console.log(`[emailService] Reporting link: ${link}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "MBO Platform <noreply@azienda.it>",
    to,
    subject: `Richiesta rendicontazione MBO: ${data.dictionaryTitle}`,
    html,
  });
}
