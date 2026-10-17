import { Router, type Request, type Response } from 'express';
import { storage } from '../storage';
import { sendLetterFile } from './letterStore';
import { computeVersions } from './versioning';
import {
  OTP_MAX_ATTEMPTS, OTP_VALID_MINUTES, SIGNATURE_DECLARATION, SignatureError,
  requestSignatureOtp, verifyAndSign,
} from './signatureService';
import { z } from 'zod';

/**
 * Employee-facing letters API, mounted at /api/me/letters behind isAuthenticated.
 * The user is always taken from the session (never from request headers), and every
 * lookup is scoped to that user: someone else's letter is indistinguishable from a
 * missing one (404).
 */
const router = Router();

function sessionUserId(req: Request): string {
  return (req.user as any).id;
}

async function findOwnLetter(req: Request, res: Response) {
  const letter = await storage.getEmployeeLetter(req.params.id);
  const visible = letter
    && letter.userId === sessionUserId(req)
    && letter.status !== 'draft'
    && letter.status !== 'revoked';
  if (!visible) {
    res.status(404).json({ error: 'Lettera non trovata' });
    return null;
  }
  return letter;
}

router.get('/', async (req, res) => {
  const userId = sessionUserId(req);
  const letters = await storage.getVisibleLettersForUser(userId);
  const versions = computeVersions(await storage.getNonDraftLettersForUsers([userId]));
  const visibleIds = new Set(letters.map(l => l.id));
  const signatures = new Map(await Promise.all(
    letters.filter(l => l.status === 'signed').map(async l => [l.id, await storage.getLetterSignature(l.id)] as const),
  ));

  res.json(letters.map(({ filePath, ...rest }) => {
    // filePath is internal: never expose server paths to the client.
    const v = versions.get(rest.id);
    const sig = signatures.get(rest.id);
    return {
      ...rest,
      signature: sig ? { transactionId: sig.transactionId, signedAt: sig.signedAt, hasSignedFile: !!sig.signedFilePath } : null,
      version: v?.version ?? 1,
      replaces: v?.replaces ? { ...v.replaces, visible: visibleIds.has(v.replaces.id) } : null,
      // Only point to a newer version the employee can actually open.
      replacedBy: v?.replacedBy && visibleIds.has(v.replacedBy.id) ? v.replacedBy : null,
    };
  }));
});

// A signed letter is served as its sealed copy unless ?original=1 is requested.
router.get('/:id/file', async (req, res) => {
  const letter = await findOwnLetter(req, res);
  if (!letter) return;
  await storage.markEmployeeLetterViewed(letter.id);
  const signed = letter.status === 'signed' && req.query.original !== '1'
    ? (await storage.getLetterSignature(letter.id))?.signedFilePath
    : null;
  sendLetterFile(res, letter, req.query.download === '1', signed);
});

// ─── Signature (OTP via email) ───────────────────────────────────────────────

function handleSignatureError(res: Response, err: unknown) {
  if (err instanceof SignatureError) {
    if (typeof err.extra.retryAfter === 'number') res.setHeader('Retry-After', String(err.extra.retryAfter));
    return res.status(err.status).json({ error: err.message, ...err.extra });
  }
  console.error('[firma]', err);
  res.status(500).json({ error: 'Errore durante la firma: riprova più tardi' });
}

router.get('/:id/sign', async (req, res) => {
  const letter = await findOwnLetter(req, res);
  if (!letter) return;
  res.json({ declaration: SIGNATURE_DECLARATION, otpValidMinutes: OTP_VALID_MINUTES, maxAttempts: OTP_MAX_ATTEMPTS });
});

router.post('/:id/sign/otp', async (req, res) => {
  const letter = await findOwnLetter(req, res);
  if (!letter) return;
  try {
    res.json(await requestSignatureOtp(letter, req.ip ?? null));
  } catch (err) {
    handleSignatureError(res, err);
  }
});

const verifySchema = z.object({
  requestId: z.string().min(1),
  code: z.string().regex(/^\s*\d{6}\s*$/),
  accepted: z.boolean(),
});

router.post('/:id/sign/verify', async (req, res) => {
  const letter = await findOwnLetter(req, res);
  if (!letter) return;
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Inserisci il codice di 6 cifre ricevuto via email' });
  try {
    res.json(await verifyAndSign(letter, {
      ...parsed.data,
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    }));
  } catch (err) {
    handleSignatureError(res, err);
  }
});

export default router;
