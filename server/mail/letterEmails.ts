import type { Request } from "express";
import type { MailMessage } from "./mailProvider";
import { esc, infoRow, renderEmail } from "./templates";

/**
 * Base URL for links in emails. APP_BASE_URL should be set in production: the
 * Host header fallback can be spoofed by whoever triggers the request.
 */
export function appBaseUrl(req: Request): string {
  return (process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
}

const fmtDate = (unix: number) => new Date(unix * 1000).toLocaleDateString("it-IT");

/** One-time code to sign a letter. The code is the only secret in the message. */
export function signatureOtpEmail(to: string, d: { code: string; letterTitle: string; validMinutes: number }): MailMessage {
  return {
    to,
    subject: `Codice per firmare: ${d.letterTitle}`,
    html: renderEmail({
      badge: "Firma lettera",
      title: "Il tuo codice di firma",
      bodyHtml: `
        <p class="lead">Hai chiesto di firmare la lettera <strong>${esc(d.letterTitle)}</strong>. Inserisci questo codice nella piattaforma:</p>
        <div class="code">${esc(d.code)}</div>
        <p class="lead">Il codice è valido per ${d.validMinutes} minuti e può essere usato una sola volta.</p>`,
      note: "Se non hai chiesto tu di firmare questa lettera, non usare il codice e avvisa l'Ufficio HR. Nessuno dell'azienda ti chiederà mai di comunicargli questo codice.",
    }),
  };
}

/** A letter (or a new version of one) has been published in the employee's personal area. */
export function letterPublishedEmail(to: string, d: {
  recipientName: string;
  letterTitle: string;
  lettersUrl: string;
  isNewVersion: boolean;
  versionNote?: string | null;
  requiresSignature: boolean;
  dueDate?: number | null;
}): MailMessage {
  const what = d.isNewVersion ? "una nuova versione di una lettera" : "una nuova lettera";
  return {
    to,
    subject: d.isNewVersion ? `Nuova versione: ${d.letterTitle}` : `Nuova lettera: ${d.letterTitle}`,
    html: renderEmail({
      badge: d.isNewVersion ? "Lettera aggiornata" : "Nuova lettera",
      title: d.isNewVersion ? "È disponibile una nuova versione" : "Hai ricevuto una lettera",
      bodyHtml: `
        <p class="lead">Gentile ${esc(d.recipientName || "collega")},<br><br>
        l'Ufficio HR ha pubblicato ${what} nella tua area personale.${d.isNewVersion ? " La versione precedente non è più valida." : ""}</p>
        ${infoRow("Lettera", d.letterTitle)}
        ${d.isNewVersion && d.versionNote ? infoRow("Motivo dell'aggiornamento", d.versionNote) : ""}
        ${d.requiresSignature ? infoRow("Firma richiesta", d.dueDate ? `entro il ${fmtDate(d.dueDate)}` : "sì") : ""}`,
      cta: { label: "Apri le mie lettere →", url: d.lettersUrl },
      note: "Per motivi di riservatezza la lettera non è allegata: puoi consultarla solo accedendo alla piattaforma.",
    }),
  };
}

/** Reminder for a letter still waiting for the employee's signature. */
export function signatureReminderEmail(to: string, d: {
  recipientName: string;
  letterTitle: string;
  lettersUrl: string;
  dueDate: number | null;
  overdue: boolean;
}): MailMessage {
  const when = d.dueDate ? (d.overdue ? `era richiesta entro il ${fmtDate(d.dueDate)}` : `è richiesta entro il ${fmtDate(d.dueDate)}`) : "è richiesta";
  return {
    to,
    subject: `${d.overdue ? "Firma scaduta" : "Promemoria firma"}: ${d.letterTitle}`,
    html: renderEmail({
      badge: d.overdue ? "Firma scaduta" : "Promemoria",
      title: "Una lettera attende la tua firma",
      bodyHtml: `
        <p class="lead">Gentile ${esc(d.recipientName || "collega")},<br><br>
        la tua firma sulla lettera <strong>${esc(d.letterTitle)}</strong> ${when}.</p>`,
      cta: { label: "Firma ora →", url: d.lettersUrl },
      note: "Se hai già firmato, ignora questo messaggio. Per dubbi sul contenuto della lettera contatta l'Ufficio HR.",
    }),
  };
}
