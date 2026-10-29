/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { computeHash } from './devUtils';

// ==========================================
// 1. CRC32 CHECKSUM
// ==========================================

const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c;
}

export function computeCrc32(data: Uint8Array | ArrayBuffer | string): string {
  const bytes =
    typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data instanceof Uint8Array
      ? data
      : new Uint8Array(data);

  let crc = 0 ^ -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  const result = (crc ^ -1) >>> 0;
  return result.toString(16).padStart(8, '0').toUpperCase();
}

export interface FileChecksums {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
  crc32: string;
  sizeBytes: number;
}

export async function computeAllChecksums(buffer: ArrayBuffer): Promise<FileChecksums> {
  const [md5, sha1, sha256, sha512] = await Promise.all([
    computeHash(buffer, 'MD5'),
    computeHash(buffer, 'SHA-1'),
    computeHash(buffer, 'SHA-256'),
    computeHash(buffer, 'SHA-512'),
  ]);
  const crc32 = computeCrc32(buffer);

  return {
    md5,
    sha1,
    sha256,
    sha512,
    crc32,
    sizeBytes: buffer.byteLength,
  };
}

// ==========================================
// 2. CSV / TSV PARSER & FORMATTER
// ==========================================

export function detectCsvDelimiter(text: string): string {
  const sample = text.slice(0, 4096);
  const commas = (sample.match(/,/g) || []).length;
  const tabs = (sample.match(/\t/g) || []).length;
  const semicolons = (sample.match(/;/g) || []).length;
  const pipes = (sample.match(/\|/g) || []).length;

  const counts = [
    { delim: ',', count: commas },
    { delim: '\t', count: tabs },
    { delim: ';', count: semicolons },
    { delim: '|', count: pipes },
  ];
  counts.sort((a, b) => b.count - a.count);
  return counts[0].count > 0 ? counts[0].delim : ',';
}

export function parseCsv(text: string, delimiter?: string): string[][] {
  if (!text || !text.trim()) return [];
  const delim = delimiter || detectCsvDelimiter(text);

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  let i = 0;

  const len = text.length;
  while (i < len) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          insideQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
        i++;
        continue;
      } else if (char === delim) {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
        continue;
      } else {
        currentField += char;
        i++;
      }
    }
  }

  // Push final field/row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // Clean trailing empty row if file ended with newline
  if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }

  return rows;
}

export function formatCsv(rows: string[][], delimiter: string = ','): string {
  return rows
    .map((row) =>
      row
        .map((field) => {
          const str = String(field ?? '');
          if (
            str.includes(delimiter) ||
            str.includes('"') ||
            str.includes('\n') ||
            str.includes('\r')
          ) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(delimiter)
    )
    .join('\n');
}

// ==========================================
// 3. CSV TO JSON
// ==========================================

export interface CsvToJsonOptions {
  delimiter?: string;
  outputMode?: 'objects' | 'arrays' | 'columnar';
  inferTypes?: boolean;
  indent?: number;
}

export function csvToJson(csvText: string, options: CsvToJsonOptions = {}): string {
  const rows = parseCsv(csvText, options.delimiter);
  if (rows.length === 0) return '[]';

  const inferTypes = options.inferTypes ?? true;
  const parseValue = (val: string): unknown => {
    if (!inferTypes) return val;
    val = val.trim();
    if (val === '') return '';
    if (val.toLowerCase() === 'true') return true;
    if (val.toLowerCase() === 'false') return false;
    if (val.toLowerCase() === 'null') return null;
    if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(val)) {
      const num = Number(val);
      if (!Number.isNaN(num)) return num;
    }
    return val;
  };

  const mode = options.outputMode || 'objects';
  const indent = options.indent ?? 2;

  if (mode === 'arrays') {
    const matrix = rows.map((r) => r.map((cell) => parseValue(cell)));
    return JSON.stringify(matrix, null, indent);
  }

  const headers = rows[0].map((h, i) => h.trim() || `column_${i + 1}`);
  const dataRows = rows.slice(1);

  if (mode === 'columnar') {
    const columns: Record<string, unknown[]> = {};
    headers.forEach((h) => {
      columns[h] = [];
    });

    dataRows.forEach((r) => {
      headers.forEach((h, colIndex) => {
        columns[h].push(parseValue(r[colIndex] ?? ''));
      });
    });

    return JSON.stringify(columns, null, indent);
  }

  // Default: Array of objects
  const objects = dataRows.map((r) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, colIndex) => {
      obj[h] = parseValue(r[colIndex] ?? '');
    });
    return obj;
  });

  return JSON.stringify(objects, null, indent);
}

// ==========================================
// 4. FILE SIZE CONVERTER
// ==========================================

export interface FileSizeConversionItem {
  unit: string;
  name: string;
  value: number;
  formatted: string;
  system: 'Decimal (SI)' | 'Binary (IEC)';
}

export function convertFileSize(
  value: number,
  fromUnit: string
): { bytes: number; conversions: FileSizeConversionItem[] } {
  const cleanUnit = fromUnit.trim().toUpperCase();

  const unitFactors: Record<string, number> = {
    B: 1,
    BYTES: 1,
    BYTE: 1,
    // Decimal (1000 base)
    KB: 1e3,
    MB: 1e6,
    GB: 1e9,
    TB: 1e12,
    PB: 1e15,
    // Binary (1024 base)
    KIB: 1024,
    MIB: 1024 ** 2,
    GIB: 1024 ** 3,
    TIB: 1024 ** 4,
    PIB: 1024 ** 5,
  };

  const factor = unitFactors[cleanUnit] || 1;
  const bytes = Math.max(0, value * factor);

  const targets = [
    { unit: 'B', name: 'Bytes', factor: 1, system: 'Decimal (SI)' as const },
    { unit: 'KB', name: 'Kilobytes (10³)', factor: 1e3, system: 'Decimal (SI)' as const },
    { unit: 'MB', name: 'Megabytes (10⁶)', factor: 1e6, system: 'Decimal (SI)' as const },
    { unit: 'GB', name: 'Gigabytes (10⁹)', factor: 1e9, system: 'Decimal (SI)' as const },
    { unit: 'TB', name: 'Terabytes (10¹²)', factor: 1e12, system: 'Decimal (SI)' as const },
    { unit: 'PB', name: 'Petabytes (10¹⁵)', factor: 1e15, system: 'Decimal (SI)' as const },
    { unit: 'KiB', name: 'Kibibytes (2¹⁰)', factor: 1024, system: 'Binary (IEC)' as const },
    { unit: 'MiB', name: 'Mebibytes (2²⁰)', factor: 1024 ** 2, system: 'Binary (IEC)' as const },
    { unit: 'GiB', name: 'Gibibytes (2³⁰)', factor: 1024 ** 3, system: 'Binary (IEC)' as const },
    { unit: 'TiB', name: 'Tebibytes (2⁴⁰)', factor: 1024 ** 4, system: 'Binary (IEC)' as const },
    { unit: 'PiB', name: 'Pebibytes (2⁵⁰)', factor: 1024 ** 5, system: 'Binary (IEC)' as const },
  ];

  const conversions: FileSizeConversionItem[] = targets.map((t) => {
    const converted = bytes / t.factor;
    let formatted: string;
    if (converted === 0) formatted = '0';
    else if (converted >= 1e9) formatted = converted.toExponential(4);
    else if (Number.isInteger(converted)) formatted = converted.toLocaleString();
    else formatted = converted.toLocaleString(undefined, { maximumFractionDigits: 6 });

    return {
      unit: t.unit,
      name: t.name,
      value: converted,
      formatted,
      system: t.system,
    };
  });

  return { bytes, conversions };
}

// ==========================================
// 5. EXCEL (XLSX) TO CSV (PURE IN-BROWSER VIA JSZip)
// ==========================================

export async function parseXlsx(
  buffer: ArrayBuffer
): Promise<{ sheetNames: string[]; sheets: Record<string, string[][]> }> {
  const zip = await JSZip.loadAsync(buffer);

  // Helper to decode XML entities
  const unescapeXml = (str: string): string => {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  };

  // 1. Read shared strings if available
  const sharedStrings: string[] = [];
  const sharedStringsFile = zip.file('xl/sharedStrings.xml');
  if (sharedStringsFile) {
    const xmlText = await sharedStringsFile.async('text');
    const siRegex = /<si\b[^>]*>(.*?)<\/si>/gs;
    let siMatch: RegExpExecArray | null;
    while ((siMatch = siRegex.exec(xmlText)) !== null) {
      const siContent = siMatch[1];
      const tRegex = /<t\b[^>]*>(.*?)<\/t>/gs;
      let tMatch: RegExpExecArray | null;
      let combined = '';
      while ((tMatch = tRegex.exec(siContent)) !== null) {
        combined += unescapeXml(tMatch[1]);
      }
      sharedStrings.push(combined);
    }
  }

  // 2. Read workbook.xml to get sheet names and order
  const sheetNames: string[] = [];
  const workbookFile = zip.file('xl/workbook.xml');
  if (workbookFile) {
    const wbXml = await workbookFile.async('text');
    const sheetRegex = /<sheet\b[^>]*name="([^"]+)"/g;
    let sMatch: RegExpExecArray | null;
    while ((sMatch = sheetRegex.exec(wbXml)) !== null) {
      sheetNames.push(unescapeXml(sMatch[1]));
    }
  }

  if (sheetNames.length === 0) {
    sheetNames.push('Sheet1');
  }

  // 3. Parse worksheets
  const sheets: Record<string, string[][]> = {};

  const colRefToIndex = (ref: string): number => {
    let col = 0;
    const letters = ref.replace(/[^A-Z]/g, '');
    for (let i = 0; i < letters.length; i++) {
      col = col * 26 + (letters.charCodeAt(i) - 64);
    }
    return Math.max(0, col - 1);
  };

  for (let idx = 0; idx < sheetNames.length; idx++) {
    const sheetPath = `xl/worksheets/sheet${idx + 1}.xml`;
    const sheetFile = zip.file(sheetPath);
    if (!sheetFile) continue;

    const sheetXml = await sheetFile.async('text');
    const rowsMatrix: string[][] = [];

    // Parse each <row>
    const rowRegex = /<row\b[^>]*>(.*?)<\/row>/gs;
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
      const rowContent = rowMatch[1];
      const rowArr: string[] = [];

      // Parse each <c>
      const cellRegex = /<c\b([^>]*?)(?:>(.*?)<\/c>|\/>)/gs;
      let cellMatch: RegExpExecArray | null;

      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        const cellAttrs = cellMatch[1];
        const cellBody = cellMatch[2] || '';

        const refMatch = /r="([A-Z0-9]+)"/.exec(cellAttrs);
        const ref = refMatch ? refMatch[1] : '';
        const targetCol = colRefToIndex(ref);

        const typeMatch = /t="([^"]+)"/.exec(cellAttrs);
        const cellType = typeMatch ? typeMatch[1] : '';

        while (rowArr.length < targetCol) {
          rowArr.push('');
        }

        let cellValue = '';
        if (cellType === 's') {
          // Shared string
          const vMatch = /<v>(.*?)<\/v>/.exec(cellBody);
          const strIndex = parseInt(vMatch ? vMatch[1] : '0', 10);
          cellValue = sharedStrings[strIndex] || '';
        } else if (cellType === 'inlineStr') {
          const tMatch = /<t\b[^>]*>(.*?)<\/t>/.exec(cellBody);
          cellValue = tMatch ? unescapeXml(tMatch[1]) : '';
        } else {
          // Number, boolean, etc.
          const vMatch = /<v>(.*?)<\/v>/.exec(cellBody);
          cellValue = vMatch ? unescapeXml(vMatch[1]) : '';
        }

        rowArr[targetCol] = cellValue;
      }

      rowsMatrix.push(rowArr);
    }

    // Normalize column length for all rows in this sheet
    let maxCols = 0;
    rowsMatrix.forEach((r) => {
      if (r.length > maxCols) maxCols = r.length;
    });
    rowsMatrix.forEach((r) => {
      while (r.length < maxCols) r.push('');
    });

    sheets[sheetNames[idx]] = rowsMatrix;
  }

  return { sheetNames, sheets };
}

// ==========================================
// 6. CSV TO EXCEL (XLSX) CREATOR (VIA JSZip)
// ==========================================

export async function createXlsx(rows: string[][], sheetName: string = 'Sheet1'): Promise<Blob> {
  const zip = new JSZip();

  const sanitizeXml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const colIndexToRef = (index: number): string => {
    let ref = '';
    let num = index + 1;
    while (num > 0) {
      const rem = (num - 1) % 26;
      ref = String.fromCharCode(65 + rem) + ref;
      num = Math.floor((num - 1) / 26);
    }
    return ref;
  };

  // 1. Build sheet XML
  let sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  sheetXml += `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n`;
  sheetXml += `  <sheetData>\n`;

  rows.forEach((row, rowIdx) => {
    const rowNum = rowIdx + 1;
    sheetXml += `    <row r="${rowNum}">\n`;
    row.forEach((cellValue, colIdx) => {
      const colRef = colIndexToRef(colIdx) + rowNum;
      const cleanVal = sanitizeXml(String(cellValue ?? ''));
      sheetXml += `      <c r="${colRef}" t="inlineStr"><is><t>${cleanVal}</t></is></c>\n`;
    });
    sheetXml += `    </row>\n`;
  });

  sheetXml += `  </sheetData>\n`;
  sheetXml += `</worksheet>`;

  // 2. Add [Content_Types].xml
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

  // 3. Add _rels/.rels
  const packageRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  // 4. Add xl/workbook.xml
  const cleanSheetName = sanitizeXml(sheetName || 'Sheet1');
  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${cleanSheetName}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  // 5. Add xl/_rels/workbook.xml.rels
  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

  // Assemble into zip
  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', packageRelsXml);
  zip.file('xl/workbook.xml', workbookXml);
  zip.file('xl/_rels/workbook.xml.rels', workbookRelsXml);
  zip.file('xl/worksheets/sheet1.xml', sheetXml);

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ==========================================
// 7. FILE SIGNATURE (MAGIC BYTES) DETECTOR
// ==========================================

export interface FileSignatureMatch {
  format: string;
  mime: string;
  category: string;
  description: string;
  magicHex: string;
}

export function identifyFileSignature(buffer: ArrayBuffer | Uint8Array): FileSignatureMatch {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const len = bytes.length;

  const hexAt = (start: number, count: number): string => {
    let hex = '';
    for (let i = start; i < Math.min(start + count, len); i++) {
      hex += bytes[i].toString(16).padStart(2, '0').toUpperCase();
    }
    return hex;
  };

  const fullHeaderHex = hexAt(0, 16);

  // Common Magic Signatures
  if (hexAt(0, 8) === '89504E470D0A1A0A') {
    return {
      format: 'PNG',
      mime: 'image/png',
      category: 'Image',
      description: 'Portable Network Graphics lossless image',
      magicHex: '89 50 4E 47 0D 0A 1A 0A',
    };
  }
  if (hexAt(0, 3) === 'FFD8FF') {
    return {
      format: 'JPEG / JPG',
      mime: 'image/jpeg',
      category: 'Image',
      description: 'Joint Photographic Experts Group lossy image',
      magicHex: 'FF D8 FF',
    };
  }
  if (hexAt(0, 6) === '474946383761' || hexAt(0, 6) === '474946383961') {
    return {
      format: 'GIF',
      mime: 'image/gif',
      category: 'Image',
      description: 'Graphics Interchange Format animated image',
      magicHex: '47 49 46 38',
    };
  }
  if (hexAt(0, 4) === '52494646' && hexAt(8, 4) === '57454250') {
    return {
      format: 'WEBP',
      mime: 'image/webp',
      category: 'Image',
      description: 'WebP modern compressed image container',
      magicHex: '52 49 46 46 ... 57 45 42 50',
    };
  }
  if (hexAt(0, 4) === '25504446') {
    return {
      format: 'PDF',
      mime: 'application/pdf',
      category: 'Document',
      description: 'Adobe Portable Document Format',
      magicHex: '25 50 44 46 (%PDF)',
    };
  }
  if (hexAt(0, 4) === '504B0304' || hexAt(0, 4) === '504B0506') {
    return {
      format: 'ZIP / Office OpenXML',
      mime: 'application/zip',
      category: 'Archive',
      description: 'ZIP compressed archive (or DOCX/XLSX/EPUB package)',
      magicHex: '50 4B 03 04 (PK..)',
    };
  }
  if (hexAt(0, 6) === '377ABCAF271C') {
    return {
      format: '7Z',
      mime: 'application/x-7z-compressed',
      category: 'Archive',
      description: '7-Zip high compression archive',
      magicHex: '37 7A BC AF 27 1C',
    };
  }
  if (hexAt(0, 6) === '526172211A07') {
    return {
      format: 'RAR',
      mime: 'application/vnd.rar',
      category: 'Archive',
      description: 'Roshal Archive compressed file',
      magicHex: '52 61 72 21 1A 07',
    };
  }
  if (hexAt(0, 2) === '1F8B') {
    return {
      format: 'GZIP',
      mime: 'application/gzip',
      category: 'Archive',
      description: 'Gnu Zipped compressed data stream',
      magicHex: '1F 8B',
    };
  }
  if (hexAt(0, 4) === '1A45DFA3') {
    return {
      format: 'MKV / WebM',
      mime: 'video/webm',
      category: 'Video',
      description: 'Matroska multimedia video/audio container',
      magicHex: '1A 45 DF A3',
    };
  }
  if (hexAt(4, 4) === '66747970') {
    return {
      format: 'MP4 / M4A',
      mime: 'video/mp4',
      category: 'Video',
      description: 'MPEG-4 Part 14 multimedia container',
      magicHex: '.... 66 74 79 70 (ftyp)',
    };
  }
  if (hexAt(0, 3) === '494433' || hexAt(0, 2) === 'FFFB' || hexAt(0, 2) === 'FFF3') {
    return {
      format: 'MP3',
      mime: 'audio/mpeg',
      category: 'Audio',
      description: 'MPEG-1 Audio Layer III audio track',
      magicHex: '49 44 33 (ID3)',
    };
  }
  if (hexAt(0, 4) === '52494646' && hexAt(8, 4) === '57415645') {
    return {
      format: 'WAV',
      mime: 'audio/wav',
      category: 'Audio',
      description: 'Waveform Audio File Format lossless audio',
      magicHex: '52 49 46 46 ... 57 41 56 45',
    };
  }
  if (hexAt(0, 4) === '664C6143') {
    return {
      format: 'FLAC',
      mime: 'audio/flac',
      category: 'Audio',
      description: 'Free Lossless Audio Codec',
      magicHex: '66 4C 61 43 (fLaC)',
    };
  }
  if (hexAt(0, 4) === '4F676753') {
    return {
      format: 'OGG',
      mime: 'audio/ogg',
      category: 'Audio',
      description: 'Ogg Vorbis / Opus audio stream',
      magicHex: '4F 67 67 53 (OggS)',
    };
  }
  if (hexAt(0, 2) === '4D5A') {
    return {
      format: 'EXE / DLL',
      mime: 'application/x-msdownload',
      category: 'Binary',
      description: 'Microsoft Windows Portable Executable',
      magicHex: '4D 5A (MZ)',
    };
  }
  if (hexAt(0, 4) === '7F454C46') {
    return {
      format: 'ELF',
      mime: 'application/x-executable',
      category: 'Binary',
      description: 'Linux Executable and Linkable Format binary',
      magicHex: '7F 45 4C 46 (.ELF)',
    };
  }
  if (hexAt(0, 2) === '424D') {
    return {
      format: 'BMP',
      mime: 'image/bmp',
      category: 'Image',
      description: 'Windows Bitmap uncompressed raster image',
      magicHex: '42 4D (BM)',
    };
  }
  if (hexAt(0, 4) === '00000100') {
    return {
      format: 'ICO',
      mime: 'image/x-icon',
      category: 'Image',
      description: 'Windows Icon resource file',
      magicHex: '00 00 01 00',
    };
  }
  if (hexAt(0, 4) === '49492A00' || hexAt(0, 4) === '4D4D002A') {
    return {
      format: 'TIFF',
      mime: 'image/tiff',
      category: 'Image',
      description: 'Tagged Image File Format',
      magicHex: '49 49 2A 00 / 4D 4D 00 2A',
    };
  }

  // Check if printable text / UTF-8
  let isAscii = true;
  const sampleLen = Math.min(len, 256);
  for (let i = 0; i < sampleLen; i++) {
    const b = bytes[i];
    if (b < 9 || (b > 13 && b < 32)) {
      isAscii = false;
      break;
    }
  }

  if (isAscii && sampleLen > 0) {
    const textSample = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 256));
    if (textSample.trim().startsWith('{') || textSample.trim().startsWith('[')) {
      return {
        format: 'JSON',
        mime: 'application/json',
        category: 'Text / Data',
        description: 'JavaScript Object Notation text',
        magicHex: fullHeaderHex,
      };
    }
    if (textSample.trim().startsWith('<?xml') || textSample.trim().startsWith('<')) {
      return {
        format: 'XML / HTML',
        mime: 'text/html',
        category: 'Text / Markup',
        description: 'Hypertext or XML structured document',
        magicHex: fullHeaderHex,
      };
    }
    return {
      format: 'Plain Text',
      mime: 'text/plain',
      category: 'Text',
      description: 'UTF-8 / ASCII plain text document',
      magicHex: fullHeaderHex,
    };
  }

  return {
    format: 'Binary Data',
    mime: 'application/octet-stream',
    category: 'Unknown',
    description: 'Generic binary data or unrecognized proprietary container',
    magicHex: fullHeaderHex,
  };
}

// ==========================================
// 8. BULK FILE RENAMER RULES
// ==========================================

export interface BulkRenameRules {
  prefix?: string;
  suffix?: string;
  findText?: string;
  replaceText?: string;
  useRegex?: boolean;
  ignoreCase?: boolean;
  caseTransform?: 'none' | 'lower' | 'upper' | 'title' | 'camel' | 'kebab' | 'snake';
  replaceSpaces?: 'none' | 'dash' | 'underscore' | 'remove';
  sequence?: {
    enabled: boolean;
    start: number;
    padding: number;
    position: 'prefix' | 'suffix';
  };
  changeExtension?: string;
}

export interface RenamedItemResult {
  originalName: string;
  newName: string;
  conflict: boolean;
}

export function applyBulkRename(
  filenames: string[],
  rules: BulkRenameRules
): RenamedItemResult[] {
  const seen = new Set<string>();
  const results: RenamedItemResult[] = [];

  filenames.forEach((originalName, index) => {
    // Separate base name and extension
    const lastDot = originalName.lastIndexOf('.');
    let baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
    let ext = lastDot > 0 ? originalName.slice(lastDot + 1) : '';

    // 1. Find & Replace
    if (rules.findText) {
      const flags = rules.ignoreCase ? 'gi' : 'g';
      if (rules.useRegex) {
        try {
          const reg = new RegExp(rules.findText, flags);
          baseName = baseName.replace(reg, rules.replaceText || '');
        } catch {
          // Ignore invalid regex
        }
      } else {
        const escaped = rules.findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reg = new RegExp(escaped, flags);
        baseName = baseName.replace(reg, rules.replaceText || '');
      }
    }

    // 2. Case Transform
    if (rules.caseTransform && rules.caseTransform !== 'none') {
      switch (rules.caseTransform) {
        case 'lower':
          baseName = baseName.toLowerCase();
          break;
        case 'upper':
          baseName = baseName.toUpperCase();
          break;
        case 'title':
          baseName = baseName.replace(/\b\w/g, (c) => c.toUpperCase());
          break;
        case 'kebab':
          baseName = baseName
            .replace(/[_\s]+/g, '-')
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase();
          break;
        case 'snake':
          baseName = baseName
            .replace(/[-\s]+/g, '_')
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase();
          break;
        case 'camel':
          baseName = baseName
            .toLowerCase()
            .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
          break;
      }
    }

    // 3. Space Replacement
    if (rules.replaceSpaces && rules.replaceSpaces !== 'none') {
      if (rules.replaceSpaces === 'dash') baseName = baseName.replace(/\s+/g, '-');
      else if (rules.replaceSpaces === 'underscore') baseName = baseName.replace(/\s+/g, '_');
      else if (rules.replaceSpaces === 'remove') baseName = baseName.replace(/\s+/g, '');
    }

    // 4. Sequence Numbering
    if (rules.sequence?.enabled) {
      const num = rules.sequence.start + index;
      const formattedNum = String(num).padStart(rules.sequence.padding || 1, '0');
      if (rules.sequence.position === 'prefix') {
        baseName = `${formattedNum}-${baseName}`;
      } else {
        baseName = `${baseName}-${formattedNum}`;
      }
    }

    // 5. Prefix & Suffix
    if (rules.prefix) baseName = rules.prefix + baseName;
    if (rules.suffix) baseName = baseName + rules.suffix;

    // 6. Extension change
    if (rules.changeExtension) {
      ext = rules.changeExtension.replace(/^\./, '');
    }

    const newName = ext ? `${baseName}.${ext}` : baseName;
    const conflict = seen.has(newName.toLowerCase());
    seen.add(newName.toLowerCase());

    results.push({
      originalName,
      newName,
      conflict,
    });
  });

  return results;
}

// ==========================================
// 9. TEXT FILE MERGER
// ==========================================

export interface TextMergeOptions {
  separator?: 'newline' | 'double-newline' | 'page-break' | 'custom';
  customSeparator?: string;
  headerStyle?: 'none' | 'hash' | 'slash' | 'tag' | 'dash';
}

export function mergeTextFiles(
  files: { name: string; content: string }[],
  options: TextMergeOptions = {}
): string {
  let sep = '\n';
  if (options.separator === 'double-newline') sep = '\n\n';
  else if (options.separator === 'page-break') sep = '\n\n--- PAGE BREAK ---\n\n';
  else if (options.separator === 'custom') sep = options.customSeparator ?? '\n';

  return files
    .map((file) => {
      let header = '';
      if (options.headerStyle === 'hash') {
        header = `### File: ${file.name}\n`;
      } else if (options.headerStyle === 'slash') {
        header = `/* ====================\n * File: ${file.name}\n * ==================== */\n`;
      } else if (options.headerStyle === 'tag') {
        header = `<!-- File: ${file.name} -->\n`;
      } else if (options.headerStyle === 'dash') {
        header = `----------------------------------------\nFile: ${file.name}\n----------------------------------------\n`;
      }
      return header + file.content;
    })
    .join(sep);
}

// ==========================================
// 10. TEXT FILE SPLITTER
// ==========================================

export interface TextSplitOptions {
  mode: 'lines' | 'parts' | 'size' | 'delimiter';
  lineCount?: number;
  partCount?: number;
  sizeBytes?: number;
  delimiter?: string;
  preserveCsvHeader?: boolean;
}

export interface SplitResultPart {
  partIndex: number;
  fileName: string;
  content: string;
  lineCount: number;
  byteSize: number;
}

export function splitTextFile(
  content: string,
  baseFilename: string = 'split_file.txt',
  options: TextSplitOptions = { mode: 'lines', lineCount: 500 }
): SplitResultPart[] {
  if (!content) return [];

  const lastDot = baseFilename.lastIndexOf('.');
  const baseName = lastDot > 0 ? baseFilename.slice(0, lastDot) : baseFilename;
  const ext = lastDot > 0 ? baseFilename.slice(lastDot) : '.txt';

  const lines = content.split(/\r?\n/);

  let csvHeader = '';
  let bodyLines = lines;
  if (options.preserveCsvHeader && lines.length > 1) {
    csvHeader = lines[0] + '\n';
    bodyLines = lines.slice(1);
  }

  const parts: string[] = [];

  if (options.mode === 'lines') {
    const chunkSize = Math.max(1, options.lineCount || 500);
    for (let i = 0; i < bodyLines.length; i += chunkSize) {
      const slice = bodyLines.slice(i, i + chunkSize).join('\n');
      parts.push(csvHeader + slice);
    }
  } else if (options.mode === 'parts') {
    const count = Math.max(1, options.partCount || 2);
    const chunkSize = Math.ceil(bodyLines.length / count);
    for (let i = 0; i < bodyLines.length; i += chunkSize) {
      const slice = bodyLines.slice(i, i + chunkSize).join('\n');
      parts.push(csvHeader + slice);
    }
  } else if (options.mode === 'delimiter') {
    const delim = options.delimiter || '---';
    const rawParts = content.split(delim);
    rawParts.forEach((p) => {
      if (p.trim()) parts.push(p.trim());
    });
  } else if (options.mode === 'size') {
    const maxBytes = Math.max(1024, options.sizeBytes || 102400); // default 100KB
    let currentPart = csvHeader;
    let currentBytes = new TextEncoder().encode(currentPart).length;

    for (let i = 0; i < bodyLines.length; i++) {
      const lineStr = (currentPart.length > 0 && currentPart !== csvHeader ? '\n' : '') + bodyLines[i];
      const lineBytes = new TextEncoder().encode(lineStr).length;

      if (currentBytes + lineBytes > maxBytes && currentPart.trim().length > 0) {
        parts.push(currentPart);
        currentPart = csvHeader + bodyLines[i];
        currentBytes = new TextEncoder().encode(currentPart).length;
      } else {
        currentPart += lineStr;
        currentBytes += lineBytes;
      }
    }
    if (currentPart.trim().length > 0) {
      parts.push(currentPart);
    }
  }

  return parts.map((partContent, idx) => {
    const partNum = idx + 1;
    const padded = String(partNum).padStart(3, '0');
    const pLines = partContent.split(/\r?\n/).length;
    const pBytes = new TextEncoder().encode(partContent).length;

    return {
      partIndex: partNum,
      fileName: `${baseName}_part_${padded}${ext}`,
      content: partContent,
      lineCount: pLines,
      byteSize: pBytes,
    };
  });
}
