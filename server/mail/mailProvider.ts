import nodemailer from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative; derived from the HTML when omitted. */
  text?: string;
}

export interface MailProvider {
  readonly name: "smtp" | "graph" | "console";
  send(message: MailMessage): Promise<void>;
}

const DEFAULT_FROM = "MBO Platform <noreply@azienda.it>";

export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|tr|li)>/gi, "\n")
    .replace(/<\/(span|td|th)>/gi, " ")
    .replace(/<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "$2: $1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    .split("\n").map(line => line.replace(/[ \t]+/g, " ").trim()).join("\n")
    .replace(/\n{3,}/g, "\n\n").trim();
}

// ─── SMTP ─────────────────────────────────────────────────────────────────────

class SmtpMailProvider implements MailProvider {
  readonly name = "smtp" as const;
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });

  async send(m: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.MAIL_FROM || DEFAULT_FROM,
      to: m.to,
      subject: m.subject,
      html: m.html,
      text: m.text ?? htmlToText(m.html),
    });
  }
}

// ─── Microsoft Graph ──────────────────────────────────────────────────────────
// App registration with the Mail.Send application permission (client credentials),
// ideally restricted to the sender mailbox with an Exchange application access policy.

class GraphMailProvider implements MailProvider {
  readonly name = "graph" as const;
  private token: { value: string; expiresAt: number } | null = null;

  constructor(
    private tenantId: string,
    private clientId: string,
    private clientSecret: string,
    private sender: string,
  ) {}

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;
    const res = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(this.tenantId)}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    });
    if (!res.ok) throw new Error(`Graph: autenticazione fallita (${res.status})`);
    const data = await res.json() as { access_token: string; expires_in: number };
    this.token = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return this.token.value;
  }

  async send(m: MailMessage): Promise<void> {
    const res = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(this.sender)}/sendMail`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await this.accessToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          subject: m.subject,
          body: { contentType: "HTML", content: m.html },
          toRecipients: [{ emailAddress: { address: m.to } }],
        },
        saveToSentItems: false,
      }),
    });
    if (res.status !== 202) throw new Error(`Graph: invio fallito (${res.status}) ${await res.text()}`);
  }
}

// ─── Console (development) ────────────────────────────────────────────────────

class ConsoleMailProvider implements MailProvider {
  readonly name = "console" as const;

  async send(m: MailMessage): Promise<void> {
    console.log(
      `[mail] (console) A: ${m.to}\n[mail] Oggetto: ${m.subject}\n` +
      (m.text ?? htmlToText(m.html)).split("\n").map(l => `[mail]   ${l}`).join("\n"),
    );
  }
}

// ─── Selection ────────────────────────────────────────────────────────────────

function createProvider(): MailProvider {
  const requested = (process.env.MAIL_PROVIDER || "").toLowerCase();

  if (requested === "graph") {
    const { GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET } = process.env;
    const sender = process.env.GRAPH_SENDER || process.env.MAIL_FROM;
    if (!GRAPH_TENANT_ID || !GRAPH_CLIENT_ID || !GRAPH_CLIENT_SECRET || !sender) {
      throw new Error("MAIL_PROVIDER=graph richiede GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET e GRAPH_SENDER");
    }
    return new GraphMailProvider(GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, sender);
  }
  if (requested === "smtp" || (!requested && process.env.SMTP_HOST)) {
    if (!process.env.SMTP_HOST) throw new Error("MAIL_PROVIDER=smtp richiede SMTP_HOST");
    return new SmtpMailProvider();
  }
  if (requested && requested !== "console") {
    throw new Error(`MAIL_PROVIDER non valido: ${requested} (valori ammessi: smtp, graph, console)`);
  }
  if (process.env.NODE_ENV === "production") {
    console.warn("[mail] Nessun provider email configurato: le email verranno solo scritte nel log.");
  }
  return new ConsoleMailProvider();
}

let provider: MailProvider | null = null;

/** The configured provider, created on first use (configuration errors surface on the first send). */
export function getMailProvider(): MailProvider {
  return (provider ??= createProvider());
}

export async function sendMail(message: MailMessage): Promise<void> {
  await getMailProvider().send(message);
}
