import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

function findLibreOffice(): string | null {
  for (const bin of ['libreoffice', 'soffice']) {
    try {
      const p = execSync(`which ${bin} 2>/dev/null`).toString().trim();
      if (p) return p;
    } catch {}
  }
  // Common install paths on Linux
  for (const p of ['/usr/bin/libreoffice', '/usr/bin/soffice', '/opt/libreoffice/program/soffice']) {
    if (fs.existsSync(p)) return p;
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
      'LibreOffice non trovato. Installa con: apt-get install libreoffice --no-install-recommends'
    );
  }

  const outDir = path.dirname(docxPath);
  execSync(`${lo} --headless --convert-to pdf --outdir "${outDir}" "${docxPath}"`, {
    timeout: 30000,
    stdio: 'pipe',
  });

  const pdfPath = docxPath.replace(/\.docx$/i, '.pdf');
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Conversione PDF fallita: file non trovato in ${pdfPath}`);
  }
  return pdfPath;
}
