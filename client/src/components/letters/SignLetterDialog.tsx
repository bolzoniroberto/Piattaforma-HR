import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";

interface SignInfo { declaration: string; otpValidMinutes: number; maxAttempts: number }
interface OtpSent { requestId: string; expiresAt: number; sentTo: string; resendAfter: number }
interface Signed { transactionId: string; signedAt: number }

/** POST helper that surfaces the server's Italian error message instead of a status code. */
async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Errore imprevisto"), { data });
  return data as T;
}

function useCountdown(target: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  return target ? Math.max(0, Math.ceil((target - now) / 1000)) : 0;
}

const fmtSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * Three steps: accept the declaration and request the code, enter the code, done.
 * All checks (letter opened, limits, integrity) are enforced server-side; the UI only guides.
 */
export function SignLetterDialog({ letterId, letterTitle, open, onOpenChange }: {
  letterId: string;
  letterTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const { data: info } = useQuery<SignInfo>({ queryKey: [`/api/me/letters/${letterId}/sign`], enabled: open });

  const [accepted, setAccepted] = useState(false);
  const [otp, setOtp] = useState<OtpSent | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [signed, setSigned] = useState<Signed | null>(null);

  const resendIn = useCountdown(resendAt);
  const expiresIn = useCountdown(otp ? otp.expiresAt * 1000 : null);

  // Fresh state every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setAccepted(false); setOtp(null); setCode(""); setError(null); setResendAt(null); setSigned(null);
  }, [open, letterId]);

  async function sendCode() {
    setBusy(true); setError(null);
    try {
      const sent = await postJson<OtpSent>(`/api/me/letters/${letterId}/sign/otp`, {});
      setOtp(sent); setCode("");
      setResendAt(Date.now() + sent.resendAfter * 1000);
    } catch (e: any) {
      setError(e.message);
      if (typeof e.data?.retryAfter === "number") setResendAt(Date.now() + e.data.retryAfter * 1000);
    } finally {
      setBusy(false);
    }
  }

  async function sign(value = code) {
    if (!otp || value.length !== 6) return;
    setBusy(true); setError(null);
    try {
      const result = await postJson<Signed>(`/api/me/letters/${letterId}/sign/verify`, {
        requestId: otp.requestId, code: value, accepted,
      });
      setSigned(result);
      qc.invalidateQueries({ queryKey: ["/api/me/letters"] });
    } catch (e: any) {
      setError(e.message);
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Firma la lettera</DialogTitle>
          <DialogDescription>{letterTitle}</DialogDescription>
        </DialogHeader>

        {signed ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <p className="font-semibold">Lettera firmata</p>
            <p className="text-sm text-slate-500">
              Firmata il {new Date(signed.signedAt * 1000).toLocaleString("it-IT")}
            </p>
            <p className="text-[11px] text-slate-400 break-all">ID transazione: {signed.transactionId}</p>
            <Button className="mt-2" onClick={() => onOpenChange(false)}>Chiudi</Button>
          </div>
        ) : !otp ? (
          <div className="flex flex-col gap-4">
            <label className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3 text-sm leading-relaxed cursor-pointer">
              <Checkbox className="mt-0.5" checked={accepted} onCheckedChange={v => setAccepted(v === true)} />
              <span>{info?.declaration ?? "Caricamento…"}</span>
            </label>
            <p className="text-xs text-slate-500 flex items-start gap-2">
              <Mail className="w-4 h-4 shrink-0" />
              Riceverai un codice di 6 cifre al tuo indirizzo email aziendale, valido {info?.otpValidMinutes ?? 10} minuti.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button disabled={!accepted || !info || busy || resendIn > 0} onClick={sendCode} className="gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {resendIn > 0 ? `Riprova tra ${resendIn} s` : "Invia il codice"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-slate-600 text-center">
              Abbiamo inviato il codice a <strong>{otp.sentTo}</strong>.
              {expiresIn > 0 ? ` Scade tra ${fmtSeconds(expiresIn)}.` : " Il codice è scaduto."}
            </p>
            <InputOTP
              maxLength={6} value={code} autoFocus disabled={busy || expiresIn === 0}
              onChange={v => setCode(v.replace(/\D/g, ""))}
              onComplete={v => sign(v)}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map(i => <InputOTPSlot key={i} index={i} />)}
              </InputOTPGroup>
            </InputOTP>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <Button className="w-full gap-2" disabled={code.length !== 6 || busy || expiresIn === 0} onClick={() => sign()}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Firma
            </Button>
            <Button variant="link" size="sm" disabled={busy || resendIn > 0} onClick={sendCode}>
              {resendIn > 0 ? `Invia un nuovo codice tra ${resendIn} s` : "Invia un nuovo codice"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
