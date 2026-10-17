/** Shared building blocks for transactional emails. Every interpolated value must go through esc(). */

export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export interface EmailLayout {
  badge: string;
  title: string;
  /** Trusted HTML: build it with esc() for any dynamic value. */
  bodyHtml: string;
  cta?: { label: string; url: string };
  note?: string;
  /** Show the CTA URL in clear text below the button (for clients that block buttons). */
  showUrl?: boolean;
  width?: number;
}

export function renderEmail(l: EmailLayout): string {
  const width = l.width ?? 560;
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><style>
  body { font-family: -apple-system, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
  .card { background: white; border-radius: 12px; padding: 32px; max-width: ${width}px; margin: 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .logo { font-weight: 800; font-size: 18px; color: #1e293b; margin-bottom: 24px; }
  .logo span { color: #4f46e5; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 8px; }
  .badge { display: inline-block; background: #ede9fe; color: #4f46e5; border-radius: 6px; padding: 3px 10px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
  .lead { color: #64748b; font-size: 14px; margin: 0 0 20px; line-height: 1.6; }
  .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  .info-row .label { color: #64748b; }
  .info-row .value { font-weight: 600; }
  .btn { display: block; background: #4f46e5; color: white !important; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; margin: 28px 0 16px; }
  .code { font-family: Consolas, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #f8fafc; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .note { font-size: 12px; color: #94a3b8; line-height: 1.6; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
  .url-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 12px; word-break: break-all; color: #475569; margin-top: 12px; }
</style></head>
<body>
  <div class="card">
    <div class="logo">Talent<span>Hub</span></div>
    <div class="badge">${esc(l.badge)}</div>
    <h1>${esc(l.title)}</h1>
    ${l.bodyHtml}
    ${l.cta ? `<a href="${esc(l.cta.url)}" class="btn">${esc(l.cta.label)}</a>` : ""}
    ${l.note ? `<p class="note">${esc(l.note)}</p>` : ""}
    ${l.cta && l.showUrl ? `<div class="url-box">${esc(l.cta.url)}</div>` : ""}
  </div>
</body>
</html>`;
}

export function infoRow(label: string, value: unknown): string {
  return `<div class="info-row"><span class="label">${esc(label)}</span><span class="value">${esc(value)}</span></div>`;
}
