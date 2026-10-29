/**
 * Word to PDF Conversion Utility Functions
 * Supports:
 * - Word wrapping text strings to fit within page margins
 * - Unicode & WinAnsi character sanitization (prevents "WinAnsi cannot encode" errors)
 * - Paginated PDF generation from structured document paragraphs & embedded images
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface DocParagraph {
  text?: string;
  isHeading?: boolean;
  imageDataUrl?: string; // Base64 data URL (e.g. data:image/png;base64,...)
  imageBytes?: Uint8Array;
  imageType?: 'png' | 'jpeg';
  imageWidth?: number;
  imageHeight?: number;
}

export interface WordToPdfOptions {
  pageSize?: 'a4' | 'letter';
  margin?: number; // In points (default 40pt)
  fontSize?: number; // In points (default 11pt)
  lineSpacing?: number; // Multiplier (default 1.35)
}

/**
 * Windows-1252 allowed single-byte and special code points.
 */
const WIN_ANSI_ALLOWED = new Set([
  0x09, 0x0a, 0x0d, 0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152,
  0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e,
  0x0178,
]);

/**
 * Comprehensive mapping for mathematical, typographical, and Unicode symbols
 * to their closest ASCII / WinAnsi printable representations.
 */
const SYMBOL_MAP: Record<string, string> = {
  // Math symbols
  '≈': '~=',
  '≠': '!=',
  '≤': '<=',
  '≥': '>=',
  '≡': '==',
  '±': '+/-',
  '×': 'x',
  '÷': '/',
  '√': 'sqrt',
  '∞': 'inf',
  '∑': 'sum',
  '∏': 'prod',
  'π': 'pi',
  'Π': 'Pi',
  'Δ': 'Delta',
  'δ': 'delta',
  'θ': 'theta',
  'λ': 'lambda',
  'μ': 'u',
  'σ': 'sigma',
  'ω': 'omega',
  'Ω': 'Ohm',
  '∂': 'd',
  '∫': 'int',
  '≈̃': '~=',

  // Punctuation & Typographic
  '“': '"',
  '”': '"',
  '‘': "'",
  '’': "'",
  '—': '--',
  '–': '-',
  '…': '...',
  '•': '*',
  '◦': 'o',
  '‣': '>',
  '·': '.',
  '°': ' deg',
  '†': '+',
  '‡': '++',

  // Arrows
  '→': '->',
  '←': '<-',
  '↔': '<->',
  '⇒': '=>',
  '⇔': '<=>',
  '↑': '^',
  '↓': 'v',

  // Marks & Bullets
  '✓': '[v]',
  '✔': '[v]',
  '✗': '[x]',
  '✘': '[x]',
  '★': '*',
  '☆': '*',
  '™': '(TM)',
  '©': '(C)',
  '®': '(R)',

  // Currencies
  '₹': 'Rs.',
  '₩': 'KRW',
  '₽': 'RUB',
  '₫': 'VND',
  '₺': 'TRY',
  '₴': 'UAH',
  '₿': 'BTC',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',

  // Zero-width & Control characters
  '\u200B': '',
  '\u200C': '',
  '\u200D': '',
  '\uFEFF': '',
  '\u00A0': ' ',
};

/**
 * Sanitizes any Unicode string so it is 100% encodable by standard PDF WinAnsi fonts.
 * Guaranteed to never throw "WinAnsi cannot encode" error.
 */
export function sanitizeWinAnsiText(input: string | undefined | null): string {
  if (!input) return '';

  let text = input;

  // 1. Direct symbol replacement
  for (const [sym, rep] of Object.entries(SYMBOL_MAP)) {
    if (text.includes(sym)) {
      text = text.replaceAll(sym, rep);
    }
  }

  // 2. Validate every character against WinAnsi codepoint range
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);

    // Standard ASCII
    if (code >= 0x20 && code <= 0x7e) {
      result += ch;
    }
    // Standard Latin-1 supplement in WinAnsi (0xA0 to 0xFF)
    else if (code >= 0xa0 && code <= 0xff) {
      result += ch;
    }
    // Specific WinAnsi codepoints (curly quotes, dashes, euro, etc.)
    else if (WIN_ANSI_ALLOWED.has(code)) {
      result += ch;
    }
    // Whitespace controls (tab, newline, cr)
    else if (code === 0x09 || code === 0x0a || code === 0x0d) {
      result += ch;
    }
    // Attempt diacritics / accent decomposition
    else {
      const decomposed = ch.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
      if (decomposed && decomposed.charCodeAt(0) >= 0x20 && decomposed.charCodeAt(0) <= 0x7e) {
        result += decomposed;
      } else {
        // Fallback for unmappable emojis or symbols
        result += ' ';
      }
    }
  }

  return result;
}

/**
 * Word-wraps a string of text to fit within a given maxWidth using character approximation.
 */
export function wrapText(text: string, maxWidth: number, approxCharWidth: number): string[] {
  if (!text || maxWidth <= 0) return [''];

  const maxCharsPerLine = Math.max(10, Math.floor(maxWidth / approxCharWidth));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Generates a clean PDF document from an array of document paragraphs and embedded images.
 */
export async function convertParagraphsToPdf(
  paragraphs: DocParagraph[],
  options: WordToPdfOptions = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setProducer('Toolora (100% In-Browser)');

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const isA4 = options.pageSize !== 'letter';
  const pageW = isA4 ? 595.28 : 612;
  const pageH = isA4 ? 841.89 : 792;
  const margin = options.margin ?? 40;
  const availW = pageW - margin * 2;

  const bodyFontSize = options.fontSize ?? 11;
  const headingFontSize = bodyFontSize * 1.5;
  const bodyLineH = bodyFontSize * (options.lineSpacing ?? 1.35);
  const headingLineH = headingFontSize * 1.3;

  let currentPage = pdfDoc.addPage([pageW, pageH]);
  let currentY = pageH - margin;

  const addNewPage = () => {
    currentPage = pdfDoc.addPage([pageW, pageH]);
    currentY = pageH - margin;
  };

  for (const p of paragraphs) {
    // 1. Handle Embedded Images
    if (p.imageDataUrl || p.imageBytes) {
      try {
        let bytes = p.imageBytes;
        if (!bytes && p.imageDataUrl) {
          const parts = p.imageDataUrl.split(',');
          const base64Str = parts.length > 1 ? parts[1] : parts[0];
          const binStr = atob(base64Str);
          bytes = new Uint8Array(binStr.length);
          for (let b = 0; b < binStr.length; b++) {
            bytes[b] = binStr.charCodeAt(b);
          }
        }

        if (bytes && bytes.length > 0) {
          const isJpg =
            p.imageType === 'jpeg' ||
            p.imageDataUrl?.includes('jpeg') ||
            p.imageDataUrl?.includes('jpg') ||
            (bytes[0] === 0xff && bytes[1] === 0xd8);

          const embedded = isJpg ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);

          const origW = embedded.width || 400;
          const origH = embedded.height || 300;
          const maxW = Math.min(availW, 460);
          const maxH = pageH - margin * 2 - 60;
          const scale = Math.min(1, maxW / origW, maxH / origH);
          const targetW = origW * scale;
          const targetH = origH * scale;

          if (currentY - targetH < margin) {
            addNewPage();
          }

          currentPage.drawImage(embedded, {
            x: margin + (availW - targetW) / 2, // Centered
            y: currentY - targetH,
            width: targetW,
            height: targetH,
          });

          currentY -= targetH + 16;
        }
      } catch (imgErr) {
        console.warn('Failed to embed image into PDF:', imgErr);
      }
      continue;
    }

    // 2. Handle Text Paragraphs
    const rawText = p.text || '';
    const safeText = sanitizeWinAnsiText(rawText).trim();
    if (!safeText) continue;

    const isHeading = !!p.isHeading;
    const currentFont = isHeading ? boldFont : font;
    const currentSize = isHeading ? headingFontSize : bodyFontSize;
    const lineH = isHeading ? headingLineH : bodyLineH;
    const approxCharW = currentSize * 0.52;

    const lines = wrapText(safeText, availW, approxCharW);

    // Extra spacing before heading
    if (isHeading && currentY < pageH - margin - 20) {
      currentY -= 12;
    }

    for (const line of lines) {
      if (currentY - lineH < margin) {
        addNewPage();
      }

      currentPage.drawText(sanitizeWinAnsiText(line), {
        x: margin,
        y: currentY - lineH,
        size: currentSize,
        font: currentFont,
        color: isHeading ? rgb(0.08, 0.12, 0.2) : rgb(0.18, 0.22, 0.28),
      });

      currentY -= lineH;
    }

    // Paragraph gap
    currentY -= 8;
  }

  return await pdfDoc.save();
}
