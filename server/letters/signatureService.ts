import crypto from 'crypto';
import type { EmployeeLetter } from '@shared/schema';
import { storage } from '../storage';
import { sendMail } from '../mail/mailProvider';
import { signatureOtpEmail } from '../mail/letterEmails';
import { deleteLetterFile, readLetterFile, saveLetterFile, sha256 } from './letterStore';
import { sealPdf } from './pdfSeal';

export const OTP_VALID_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_PER_HOUR = 5;

/** Versioned text the employee accepts; stored verbatim with each signature. */
export const SIGNATURE_DECLARATION =
  'Dichiaro di aver letto integralmente la lettera e di sottoscriverla con firma elettronica semplice, ' +
  'mediante il codice monouso ricevuto al mio indirizzo email aziendale.';

const nowUnix = () => Math.floor(Date.now() / 1000);

export class SignatureError extends Error {
  constructor(public status: number, message: string, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

function otpSecret(): string {
  const secret = process.env.OTP_SECRET || process.env.SESSION_SECRET;
  if (!secret) throw new Error('OTP_SECRET o SESSION_SECRET non configurati');
  return secret;
}

/** HMAC keyed with a server secret and salted with the request id: a DB leak alone does not reveal codes. */
function hashCode(requestId: string, code: string): string {
  return crypto.createHmac('sha256', otpSecret()).update(`${requestId}:${code}`).digest('hex');
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.slice(0, 2)}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;
}

/** Throws unless the letter can be signed by its owner right now. */
export function assertSignable(letter: EmployeeLetter): void {
  if (!letter.requiresSignature) throw new SignatureError(409, 'Questa lettera non richiede la firma');
  if (letter.status === 'signed') throw new SignatureError(409, 'La lettera è già firmata');
  if (letter.status !== 'published' && letter.status !== 'viewed') {
    throw new SignatureError(409, 'Questa versione della lettera non è più firmabile');
  }
  if (!letter.viewedAt) throw new SignatureError(409, 'Apri e leggi la lettera prima di firmarla');
  if (letter.fileFormat !== 'pdf') {
    throw new SignatureError(409, 'La lettera non è in formato PDF e non può essere firmata: contatta l\'Ufficio HR');
  }
}

export async function requestSignatureOtp(letter: EmployeeLetter, ip: string | null) {
  assertSignable(letter);

  const now = nowUnix();
  const recent = await storage.getSignatureRequestsSince(letter.id, now - 3600);
  if (recent[0] && now - recent[0].createdAt < OTP_RESEND_COOLDOWN_SECONDS) {
    const retryAfter = OTP_RESEND_COOLDOWN_SECONDS - (now - recent[0].createdAt);
    throw new SignatureError(429, `Attendi ${retryAfter} secondi prima di richiedere un nuovo codice`, { retryAfter });
  }
  if (recent.length >= OTP_MAX_PER_HOUR) {
    throw new SignatureError(429, 'Troppi codici richiesti per questa lettera: riprova tra un\'ora');
  }

  const user = await storage.getUser(letter.userId);
  if (!user?.email) throw new SignatureError(422, 'Nessun indirizzo email associato al tuo profilo: contatta l\'Ufficio HR');

  const id = crypto.randomBytes(16).toString('hex');
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const request = await storage.createSignatureRequest({
    id,
    letterId: letter.id,
    userId: letter.userId,
    codeHash: hashCode(id, code),
    sentTo: user.email,
    expiresAt: now + OTP_VALID_MINUTES * 60,
    requestIp: ip,
  });

  await sendMail(signatureOtpEmail(user.email, { code, letterTitle: letter.title, validMinutes: OTP_VALID_MINUTES }));

  return {
    requestId: request.id,
    expiresAt: request.expiresAt,
    sentTo: maskEmail(user.email),
    resendAfter: OTP_RESEND_COOLDOWN_SECONDS,
  };
}

export async function verifyAndSign(letter: EmployeeLetter, input: {
  requestId: string; code: string; accepted: boolean; ip: string | null; userAgent: string | null;
}) {
  if (!input.accepted) throw new SignatureError(400, 'Devi accettare la dichiarazione per firmare');
  assertSignable(letter);

  const request = await storage.getSignatureRequest(input.requestId);
  if (!request || request.letterId !== letter.id || request.userId !== letter.userId) {
    throw new SignatureError(404, 'Richiesta di firma non trovata');
  }
  if (request.consumedAt || request.invalidatedAt) {
    throw new SignatureError(410, 'Codice non più valido: richiedine uno nuovo');
  }
  if (request.expiresAt < nowUnix()) throw new SignatureError(410, 'Codice scaduto: richiedine uno nuovo');

  // Count the attempt before checking the code, so parallel guesses cannot exceed the limit.
  const counted = await storage.registerOtpAttempt(request.id, OTP_MAX_ATTEMPTS);
  if (!counted) throw new SignatureError(429, 'Troppi tentativi errati: richiedi un nuovo codice');

  const expected = Buffer.from(request.codeHash, 'hex');
  const actual = Buffer.from(hashCode(request.id, input.code.trim()), 'hex');
  if (!crypto.timingSafeEqual(expected, actual)) {
    const attemptsLeft = OTP_MAX_ATTEMPTS - counted.attempts;
    throw new SignatureError(400, attemptsLeft > 0
      ? `Codice errato. Tentativi rimasti: ${attemptsLeft}`
      : 'Codice errato. Tentativi esauriti: richiedi un nuovo codice', { attemptsLeft });
  }

  // The employee signs what they were shown: the file must be byte-identical to the published one.
  let fileHash: string;
  let originalBytes: Buffer;
  try {
    originalBytes = readLetterFile(letter.filePath);
    fileHash = sha256(originalBytes);
  } catch {
    throw new SignatureError(410, 'File della lettera non disponibile: contatta l\'Ufficio HR');
  }
  if (fileHash !== letter.sha256) {
    console.error(`[firma] Integrità violata per la lettera ${letter.id}: hash atteso ${letter.sha256}, trovato ${fileHash}`);
    throw new SignatureError(409, 'Il documento risulta modificato rispetto a quello pubblicato: firma bloccata. Contatta l\'Ufficio HR');
  }

  const transactionId = crypto.randomUUID();
  const signedAt = nowUnix();
  const user = await storage.getUser(letter.userId);

  // Seal first, then record: if recording fails the sealed copy is discarded,
  // so a signed file never exists without its signature record.
  let sealed: { filePath: string; sha256: string };
  try {
    const pdf = await sealPdf(originalBytes, {
      letterTitle: letter.title,
      signerName: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || (user?.email ?? letter.userId),
      signerTaxCode: user?.codiceFiscale ?? null,
      otpSentTo: request.sentTo,
      signedAt,
      ip: input.ip,
      userAgent: input.userAgent,
      originalSha256: fileHash,
      transactionId,
      declaration: SIGNATURE_DECLARATION,
    });
    sealed = saveLetterFile(letter.userId, pdf, 'pdf');
  } catch (err) {
    console.error(`[firma] Sigillo PDF fallito per la lettera ${letter.id}:`, err);
    throw new SignatureError(500, 'Impossibile generare il documento firmato: riprova o contatta l\'Ufficio HR');
  }

  const signature = await storage.completeSignature({
    transactionId,
    letterId: letter.id,
    userId: letter.userId,
    signatureRequestId: request.id,
    method: 'otp_email',
    otpSentTo: request.sentTo,
    declaration: SIGNATURE_DECLARATION,
    originalSha256: fileHash,
    signedSha256: sealed.sha256,
    signedFilePath: sealed.filePath,
    ip: input.ip,
    userAgent: input.userAgent,
    signedAt,
  }).catch(err => { deleteLetterFile(sealed.filePath); throw err; });
  if (!signature) {
    deleteLetterFile(sealed.filePath);
    throw new SignatureError(409, 'La lettera non è più firmabile (già firmata o aggiornata nel frattempo)');
  }

  return { transactionId: signature.transactionId, signedAt: signature.signedAt };
}
