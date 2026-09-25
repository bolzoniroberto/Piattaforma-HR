/**
 * Sets the physical DPI in a JPEG JFIF header so that LibreOffice (and Word)
 * render the image at exactly `targetWidthCm` wide.
 *
 * LibreOffice ignores OOXML wp:extent for inline images and falls back to
 * the image's embedded DPI. Setting the correct DPI forces the right size.
 */
export function setJpegDpiForWidth(buf: Buffer, widthPx: number, targetWidthCm: number): Buffer {
  if (buf.length < 18) return buf;
  if (buf[0] !== 0xFF || buf[1] !== 0xD8) return buf; // not JPEG

  // Walk segments looking for APP0 JFIF
  let i = 2;
  while (i < buf.length - 4) {
    if (buf[i] !== 0xFF) break;
    const marker = buf[i + 1];
    if (marker === 0xDA) break; // Start of Scan — stop

    const segLen = buf.readUInt16BE(i + 2);

    if (marker === 0xE0 && segLen >= 14 && buf.slice(i + 4, i + 9).toString('ascii') === 'JFIF\0') {
      // Found APP0 JFIF — patch DPI in-place
      const targetWidthIn = targetWidthCm / 2.54;
      const dpi = Math.min(Math.round(widthPx / targetWidthIn), 65535);
      const out = Buffer.from(buf);
      out[i + 11] = 1;               // units = 1 (DPI)
      out.writeUInt16BE(dpi, i + 12); // X density
      out.writeUInt16BE(dpi, i + 14); // Y density
      return out;
    }

    i += 2 + segLen;
  }

  return buf; // no JFIF segment found — return unchanged
}

/**
 * Sets the physical resolution in a PNG pHYs chunk so LibreOffice renders
 * the image at exactly `targetWidthCm` wide.
 */
export function setPngDpiForWidth(buf: Buffer, widthPx: number, targetWidthCm: number): Buffer {
  if (buf.length < 8) return buf;
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] !== 0x89 || buf[1] !== 0x50) return buf;

  const targetWidthIn = targetWidthCm / 2.54;
  const pixelsPerMeter = Math.round((widthPx / targetWidthIn) * 39.3701);

  // Find existing pHYs chunk (starts after the 8-byte PNG signature)
  let i = 8;
  while (i < buf.length - 12) {
    const chunkLen  = buf.readUInt32BE(i);
    const chunkType = buf.slice(i + 4, i + 8).toString('ascii');

    if (chunkType === 'pHYs') {
      // Patch existing pHYs chunk
      const out = Buffer.from(buf);
      out.writeUInt32BE(pixelsPerMeter, i + 8);  // pixels per unit X
      out.writeUInt32BE(pixelsPerMeter, i + 12); // pixels per unit Y
      out[i + 16] = 1;                           // unit = meter
      // Recalculate CRC (last 4 bytes of chunk)
      const crc = crc32(out.slice(i + 4, i + 8 + chunkLen));
      out.writeInt32BE(crc, i + 8 + chunkLen);
      return out;
    }

    if (chunkType === 'IDAT') {
      // pHYs must appear before IDAT — inject pHYs chunk here
      const phys = Buffer.alloc(4 + 4 + 9 + 4); // len + type + data + crc
      phys.writeUInt32BE(9, 0);                        // chunk length = 9 bytes
      phys.write('pHYs', 4, 'ascii');
      phys.writeUInt32BE(pixelsPerMeter, 8);
      phys.writeUInt32BE(pixelsPerMeter, 12);
      phys[16] = 1;                                    // unit = meter
      const crc = crc32(phys.slice(4, 17));
      phys.writeInt32BE(crc, 17);
      return Buffer.concat([buf.slice(0, i), phys, buf.slice(i)]);
    }

    i += 4 + 4 + chunkLen + 4;
  }

  return buf;
}

// Minimal CRC-32 for PNG chunks
function crc32(buf: Buffer): number {
  const table = makeCrcTable();
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) | 0;
}

function makeCrcTable(): Uint32Array {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
}
