import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { Response } from 'express';
import type { EmployeeLetter } from '@shared/schema';

/**
 * Private archive of employee letters. Lives under uploads/, which is never
 * served statically: files are only reachable through authorized endpoints.
 * File names are random ids, never personal data.
 */
export const LETTERS_DIR = path.join(process.cwd(), 'uploads', 'letters');

export function sha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Saves a letter and returns its path relative to LETTERS_DIR (what goes in the DB),
 * so the archive keeps working if the application folder moves.
 */
export function saveLetterFile(userId: string, buffer: Buffer, ext: 'pdf' | 'docx'): { filePath: string; sha256: string } {
  const safeUser = userId.replace(/[^a-zA-Z0-9._-]/g, '_');
  const relPath = `${safeUser}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
  fs.mkdirSync(path.join(LETTERS_DIR, safeUser), { recursive: true });
  fs.writeFileSync(path.join(LETTERS_DIR, relPath), buffer, { flag: 'wx' });
  return { filePath: relPath, sha256: sha256(buffer) };
}

/** Defense in depth: never touch files outside the archive, whatever the DB says. */
function resolveInArchive(relPath: string): string {
  const resolved = path.resolve(LETTERS_DIR, relPath);
  const rel = path.relative(LETTERS_DIR, resolved);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Percorso lettera non valido');
  }
  return resolved;
}

export function readLetterFile(relPath: string): Buffer {
  return fs.readFileSync(resolveInArchive(relPath));
}

export function deleteLetterFile(relPath: string): void {
  try { fs.unlinkSync(resolveInArchive(relPath)); } catch {}
}

export const LETTER_CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * Streams a letter. `download` forces a save dialog; otherwise PDFs open inline.
 * With `signedFilePath` the sealed copy (original + attestation page) is sent instead.
 */
export function sendLetterFile(res: Response, letter: EmployeeLetter, download: boolean, signedFilePath?: string | null): void {
  let buffer: Buffer;
  try {
    buffer = readLetterFile(signedFilePath ?? letter.filePath);
  } catch {
    res.status(410).json({ error: 'File non più disponibile' });
    return;
  }
  const format = signedFilePath ? 'pdf' : letter.fileFormat;
  const baseName = letter.title.replace(/[^a-zA-Z0-9À-ÿ ]/g, '').replace(/\s+/g, '_') || 'lettera';
  const fileName = `${baseName}${signedFilePath ? '_firmata' : ''}.${format}`;
  const disposition = download || format !== 'pdf' ? 'attachment' : 'inline';
  res.setHeader('Content-Type', LETTER_CONTENT_TYPES[format] ?? 'application/octet-stream');
  res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(buffer);
}
