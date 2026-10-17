import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { pathToFileURL } from 'url';

const COMMON_PATHS: Record<string, string[]> = {
  win32: [
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
  ],
  darwin: ['/Applications/LibreOffice.app/Contents/MacOS/soffice'],
  linux: ['/usr/bin/libreoffice', '/usr/bin/soffice', '/opt/libreoffice/program/soffice'],
};

const PROFILE_DIR = path.join(os.tmpdir(), 'piattaforma-hr-libreoffice-profile');

let cachedPath: string | null | undefined;

function lookupInPath(bin: string): string | null {
  const finder = process.platform === 'win32' ? 'where' : 'which';
  try {
    const out = execFileSync(finder, [bin], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return out.split(/\r?\n/)[0] || null;
  } catch {
    return null;
  }
}

/**
 * Locates the LibreOffice executable. Order: LIBREOFFICE_PATH env var,
 * the system PATH, then the platform's standard install locations.
 * A positive result is cached; a miss is re-checked on the next call so an
 * install done while the server runs is picked up.
 */
function findLibreOffice(): string | null {
  if (cachedPath) return cachedPath;

  const fromEnv = process.env.LIBREOFFICE_PATH;
  if (fromEnv) {
    cachedPath = fs.existsSync(fromEnv) ? fromEnv : null;
    if (!cachedPath) console.warn(`[pdf] LIBREOFFICE_PATH non valido: ${fromEnv}`);
    return cachedPath;
  }

  const bins = process.platform === 'win32' ? ['soffice.exe', 'soffice'] : ['libreoffice', 'soffice'];
  for (const bin of bins) {
    const p = lookupInPath(bin);
    if (p) return (cachedPath = p);
  }
  for (const p of COMMON_PATHS[process.platform] ?? []) {
    if (fs.existsSync(p)) return (cachedPath = p);
  }
  return null;
}

export function isLibreOfficeAvailable(): boolean {
  return findLibreOffice() !== null;
}

/**
 * Converts a .docx file to PDF using LibreOffice headless.
 * Returns the path to the generated PDF.
 * Throws if LibreOffice is not available.
 */
export function convertDocxToPdf(docxPath: string): string {
  const lo = findLibreOffice();
  if (!lo) {
    throw new Error(
      'LibreOffice non trovato. Installalo (https://www.libreoffice.org) oppure imposta LIBREOFFICE_PATH con il percorso di soffice.'
    );
  }

  // A profile dedicated to the server avoids lock conflicts with a LibreOffice the
  // user may have open. It is reused: building a fresh profile costs ~20 s per call.
  // Conversions never overlap within a process because execFileSync blocks.
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  execFileSync(lo, [
    `-env:UserInstallation=${pathToFileURL(PROFILE_DIR).href}`,
    '--headless',
    '--convert-to', 'pdf',
    '--outdir', path.dirname(docxPath),
    docxPath,
  ], { timeout: 120000, stdio: 'pipe' });

  const pdfPath = docxPath.replace(/\.docx$/i, '.pdf');
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Conversione PDF fallita: file non trovato in ${pdfPath}`);
  }
  return pdfPath;
}
