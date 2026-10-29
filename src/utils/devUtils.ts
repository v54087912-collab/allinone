/**
 * Developer Utilities:
 * JSON Formatter/Validator, JSON to CSV, HTML Entities, Hash Generator,
 * JWT Decoder, XML Formatter, SQL Formatter, Code Minifiers, Cron Parser,
 * and Multi-format Color Converter.
 */

// ==========================================
// 1. JSON Formatter & Validator
// ==========================================
export interface JsonFormatResult {
  formatted: string;
  isValid: boolean;
  error?: string;
  errorLine?: number;
  errorColumn?: number;
}

export function formatJson(raw: string, space: number | string = 2): JsonFormatResult {
  if (!raw || !raw.trim()) {
    return { formatted: '', isValid: false, error: 'Empty JSON input' };
  }
  try {
    const parsed = JSON.parse(raw);
    const formatted = JSON.stringify(parsed, null, space);
    return { formatted, isValid: true };
  } catch (err: any) {
    const msg = err?.message || 'Invalid JSON syntax';
    let line: number | undefined;
    let col: number | undefined;

    // Extract line/column if present in error message (e.g. "at position 42 (line 3 column 5)")
    const match = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i) || msg.match(/position\s+(\d+)/i);
    if (match && match[2]) {
      line = parseInt(match[1], 10);
      col = parseInt(match[2], 10);
    } else if (match && match[1]) {
      const pos = parseInt(match[1], 10);
      const lines = raw.substring(0, pos).split('\n');
      line = lines.length;
      col = lines[lines.length - 1].length + 1;
    }

    return { formatted: raw, isValid: false, error: msg, errorLine: line, errorColumn: col };
  }
}

export function minifyJson(raw: string): JsonFormatResult {
  if (!raw || !raw.trim()) {
    return { formatted: '', isValid: false, error: 'Empty JSON input' };
  }
  try {
    const parsed = JSON.parse(raw);
    return { formatted: JSON.stringify(parsed), isValid: true };
  } catch (err: any) {
    return { formatted: raw, isValid: false, error: err?.message || 'Invalid JSON syntax' };
  }
}

// ==========================================
// 2. JSON to CSV Converter
// ==========================================
export interface JsonToCsvResult {
  csv: string;
  headers: string[];
  rowCount: number;
  error?: string;
}

export function jsonToCsv(raw: string, delimiter = ','): JsonToCsvResult {
  if (!raw || !raw.trim()) {
    return { csv: '', headers: [], rowCount: 0, error: 'Empty input' };
  }

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (e: any) {
    return { csv: '', headers: [], rowCount: 0, error: `Invalid JSON: ${e.message}` };
  }

  // Handle single object or array
  let items: any[] = [];
  if (Array.isArray(data)) {
    items = data;
  } else if (typeof data === 'object' && data !== null) {
    // If it's an object with an array property (e.g. { "data": [...] }), use that array
    const arrayKey = Object.keys(data).find((k) => Array.isArray(data[k]));
    if (arrayKey) {
      items = data[arrayKey];
    } else {
      items = [data];
    }
  } else {
    return { csv: '', headers: [], rowCount: 0, error: 'JSON must be an array of objects or an object' };
  }

  if (items.length === 0) {
    return { csv: '', headers: [], rowCount: 0, error: 'JSON array is empty' };
  }

  // Collect all unique headers
  const headerSet = new Set<string>();
  items.forEach((item) => {
    if (item && typeof item === 'object') {
      Object.keys(item).forEach((k) => headerSet.add(k));
    }
  });

  const headers = Array.from(headerSet);
  if (headers.length === 0) {
    return { csv: '', headers: [], rowCount: 0, error: 'No object keys found to construct CSV columns' };
  }

  function escapeCsvCell(val: any): string {
    if (val === null || val === undefined) return '';
    let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCsvCell).join(delimiter));

  items.forEach((item) => {
    const row = headers.map((h) => escapeCsvCell(item ? item[h] : ''));
    csvRows.push(row.join(delimiter));
  });

  return {
    csv: csvRows.join('\n'),
    headers,
    rowCount: items.length,
  };
}

// ==========================================
// 3. HTML Entity Encoder / Decoder
// ==========================================
const ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

export function encodeHtmlEntities(str: string, full = false): string {
  if (!str) return '';
  if (!full) {
    return str.replace(/[&<>"']/g, (s) => ENTITY_MAP[s] || s);
  }
  return str.replace(/[\u00A0-\u9999<>&"']/gim, (c) => `&#${c.charCodeAt(0)};`);
}

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  const doc = typeof DOMParser !== 'undefined'
    ? new DOMParser().parseFromString(str, 'text/html')
    : null;
  if (doc) {
    return doc.documentElement.textContent || '';
  }
  // Fallback regex for standard entities
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_m, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// ==========================================
// 4. Cryptographic Hash Generator (MD5, SHA-1, SHA-256, SHA-384, SHA-512)
// ==========================================

// Standard RFC 1321 MD5 Implementation in pure JS
function md5(string: string): string {
  function md5cycle(x: number[], k: number[]) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function add32(a: number, b: number) {
    return (a + b) & 0xffffffff;
  }

  const s = unescape(encodeURIComponent(string));
  const n = s.length;
  const state = [1732584193, -271733879, -1732584194, 271733878];
  let i: number;
  for (i = 64; i <= n; i += 64) {
    const tail: number[] = [];
    for (let j = 0; j < 16; j++) {
      tail[j] = s.charCodeAt(i - 64 + j * 4) | (s.charCodeAt(i - 64 + j * 4 + 1) << 8) | (s.charCodeAt(i - 64 + j * 4 + 2) << 16) | (s.charCodeAt(i - 64 + j * 4 + 3) << 24);
    }
    md5cycle(state, tail);
  }
  const tail2 = new Array(16).fill(0);
  for (let j = 0; j < n % 64; j++) {
    tail2[j >> 2] |= s.charCodeAt(i - 64 + j) << ((j % 4) << 3);
  }
  tail2[(n % 64) >> 2] |= 0x80 << (((n % 64) % 4) << 3);
  if ((n % 64) > 55) {
    md5cycle(state, tail2);
    tail2.fill(0);
  }
  tail2[14] = n * 8;
  md5cycle(state, tail2);

  const hexTab = '0123456789abcdef';
  let out = '';
  for (let k = 0; k < 4; k++) {
    for (let l = 0; l < 4; l++) {
      out += hexTab.charAt((state[k] >> (l * 8 + 4)) & 0x0f) + hexTab.charAt((state[k] >> (l * 8)) & 0x0f);
    }
  }
  return out;
}

export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export async function computeHash(
  data: string | ArrayBuffer,
  algorithm: HashAlgorithm = 'SHA-256'
): Promise<string> {
  if (algorithm === 'MD5') {
    if (typeof data === 'string') {
      return md5(data);
    }
    // Convert ArrayBuffer to binary string
    const bytes = new Uint8Array(data);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return md5(binary);
  }

  // Web Crypto API
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ==========================================
// 5. JWT Decoder
// ==========================================
export interface JwtDecoded {
  header: any;
  payload: any;
  signature: string;
  isExpired: boolean;
  issuedAt?: Date;
  expiresAt?: Date;
  rawHeader: string;
  rawPayload: string;
  error?: string;
}

export function decodeJwt(token: string): JwtDecoded {
  const clean = token.trim();
  if (!clean) {
    return {
      header: null,
      payload: null,
      signature: '',
      isExpired: false,
      rawHeader: '',
      rawPayload: '',
      error: 'Empty JWT token',
    };
  }

  const parts = clean.split('.');
  if (parts.length !== 3) {
    return {
      header: null,
      payload: null,
      signature: '',
      isExpired: false,
      rawHeader: '',
      rawPayload: '',
      error: `Invalid JWT format: expected 3 dot-separated segments, got ${parts.length}`,
    };
  }

  function base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const binStr = atob(base64);
    return decodeURIComponent(
      binStr
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }

  try {
    const rawHeader = base64UrlDecode(parts[0]);
    const rawPayload = base64UrlDecode(parts[1]);
    const signature = parts[2];

    const header = JSON.parse(rawHeader);
    const payload = JSON.parse(rawPayload);

    let isExpired = false;
    let expiresAt: Date | undefined;
    let issuedAt: Date | undefined;

    if (payload.exp && typeof payload.exp === 'number') {
      expiresAt = new Date(payload.exp * 1000);
      isExpired = expiresAt.getTime() < Date.now();
    }

    if (payload.iat && typeof payload.iat === 'number') {
      issuedAt = new Date(payload.iat * 1000);
    }

    return {
      header,
      payload,
      signature,
      isExpired,
      issuedAt,
      expiresAt,
      rawHeader,
      rawPayload,
    };
  } catch (e: any) {
    return {
      header: null,
      payload: null,
      signature: parts[2] || '',
      isExpired: false,
      rawHeader: '',
      rawPayload: '',
      error: `Failed to decode JWT base64url data: ${e.message}`,
    };
  }
}

// ==========================================
// 6. XML Formatter & Validator
// ==========================================
export interface XmlFormatResult {
  formatted: string;
  isValid: boolean;
  error?: string;
}

export function formatXml(xml: string, indent = '  '): XmlFormatResult {
  if (!xml || !xml.trim()) {
    return { formatted: '', isValid: false, error: 'Empty XML input' };
  }

  // Validate via DOMParser in browser
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return {
        formatted: xml,
        isValid: false,
        error: parserError.textContent || 'XML parsing error',
      };
    }
  }

  // Formatting algorithm
  let formatted = '';
  let pad = 0;

  // Split tokens
  const cleanXml = xml
    .replace(/(>)\s*(<)/g, '$1\n$2')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  cleanXml.forEach((node) => {
    let indentDelta = 0;
    if (node.match(/.+<\/\w[^>]*>$/)) {
      // Single line node <tag>val</tag>
      indentDelta = 0;
    } else if (node.match(/^<\/\w/)) {
      // Closing node </tag>
      if (pad !== 0) pad -= 1;
    } else if (node.match(/^<\w[^>]*[^\/]>.*$/) && !node.startsWith('<?') && !node.startsWith('<!')) {
      // Opening node <tag>
      indentDelta = 1;
    }

    formatted += indent.repeat(Math.max(0, pad)) + node + '\n';
    pad += indentDelta;
  });

  return { formatted: formatted.trim(), isValid: true };
}

export function minifyXml(xml: string): string {
  if (!xml) return '';
  return xml
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+([=<>])\s+/g, '$1')
    .trim();
}

// ==========================================
// 7. SQL Formatter & Minifier
// ==========================================
const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'INSERT INTO', 'VALUES',
  'UPDATE', 'SET', 'DELETE', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
  'FULL JOIN', 'JOIN', 'ON', 'GROUP BY', 'HAVING', 'ORDER BY', 'ASC',
  'DESC', 'LIMIT', 'OFFSET', 'UNION', 'UNION ALL', 'CREATE TABLE',
  'ALTER TABLE', 'DROP TABLE', 'PRIMARY KEY', 'FOREIGN KEY', 'NOT NULL',
  'DEFAULT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AS', 'IN', 'EXISTS',
  'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL', 'DISTINCT', 'COUNT', 'AVG', 'SUM'
];

export function formatSql(sql: string, indent = '  '): string {
  if (!sql || !sql.trim()) return '';

  let formatted = sql.trim();

  // Normalize spaces
  formatted = formatted.replace(/\s+/g, ' ');

  // Standardize keyword case
  SQL_KEYWORDS.forEach((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(regex, kw);
  });

  // Major clauses that start on a new line
  const majorClauses = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'GROUP BY', 'HAVING',
    'ORDER BY', 'LIMIT', 'OFFSET', 'UNION', 'UNION ALL', 'INNER JOIN',
    'LEFT JOIN', 'RIGHT JOIN', 'JOIN', 'INSERT INTO', 'VALUES',
    'UPDATE', 'SET', 'DELETE'
  ];

  majorClauses.forEach((kw) => {
    const reg = new RegExp(`\\s+(${kw})\\b`, 'g');
    formatted = formatted.replace(reg, `\n$1`);
  });

  // Format comma separated lists in SELECT or columns
  const lines = formatted.split('\n');
  const resultLines: string[] = [];

  lines.forEach((line) => {
    line = line.trim();
    if (line.startsWith('AND') || line.startsWith('OR')) {
      resultLines.push(indent + line);
    } else if (
      line.startsWith('INNER JOIN') ||
      line.startsWith('LEFT JOIN') ||
      line.startsWith('RIGHT JOIN') ||
      line.startsWith('JOIN')
    ) {
      resultLines.push(line);
    } else {
      resultLines.push(line);
    }
  });

  return resultLines.join('\n');
}

export function minifySql(sql: string): string {
  if (!sql) return '';
  return sql
    .replace(/--.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\s+/g, ' ')
    .trim();
}

// ==========================================
// 8. Code Minifiers (HTML, CSS, JS)
// ==========================================
export function minifyHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<!--[\s\S]*?-->/g, '') // remove HTML comments
    .replace(/>\s+</g, '><') // remove whitespace between tags
    .replace(/\s{2,}/g, ' ') // collapse multi-spaces
    .trim();
}

export function minifyCss(css: string): string {
  if (!css) return '';
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
    .replace(/\s*([\{\}:;,>+~])\s*/g, '$1') // remove spacing around selectors/brackets
    .replace(/;}/g, '}') // remove trailing semicolons
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function minifyJs(js: string): string {
  if (!js) return '';
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments
    .replace(/^\s*\/\/.*$/gm, '') // remove single-line comments on their own line
    .replace(/;\s*\n/g, ';')
    .replace(/{\s*\n/g, '{')
    .replace(/}\s*\n/g, '}')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ==========================================
// 9. Cron Expression Generator & Parser
// ==========================================
export interface CronParseResult {
  expression: string;
  description: string;
  nextRuns: Date[];
  isValid: boolean;
  error?: string;
}

export function buildCron(
  minute = '*',
  hour = '*',
  dayMonth = '*',
  month = '*',
  dayWeek = '*'
): string {
  return `${minute.trim() || '*'} ${hour.trim() || '*'} ${dayMonth.trim() || '*'} ${month.trim() || '*'} ${dayWeek.trim() || '*'}`;
}

export function describeCron(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    return 'Invalid cron format (must have 5 fields)';
  }

  const [min, hr, dom, mon, dow] = parts;

  if (min === '*' && hr === '*' && dom === '*' && mon === '*' && dow === '*') {
    return 'Every minute';
  }
  if (min === '*/5' && hr === '*') return 'Every 5 minutes';
  if (min === '*/15' && hr === '*') return 'Every 15 minutes';
  if (min === '*/30' && hr === '*') return 'Every 30 minutes';
  if (min === '0' && hr === '*' && dom === '*' && mon === '*' && dow === '*') {
    return 'Every hour, on the hour';
  }
  if (min === '0' && hr === '0' && dom === '*' && mon === '*' && dow === '*') {
    return 'Every day at midnight (00:00)';
  }
  if (min === '0' && hr === '12' && dom === '*' && mon === '*' && dow === '*') {
    return 'Every day at noon (12:00)';
  }

  let desc = `Runs at `;
  if (min === '*') desc += 'every minute';
  else desc += `minute ${min}`;

  if (hr === '*') desc += `, every hour`;
  else desc += `, at ${hr.padStart(2, '0')}:00`;

  if (dom !== '*') desc += `, on day ${dom} of month`;
  if (mon !== '*') desc += `, in month ${mon}`;
  if (dow !== '*') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    desc += `, on ${days[parseInt(dow, 10)] || dow}`;
  }

  return desc;
}

export function getNextCronRuns(cron: string, count = 5): Date[] {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const [min, hr] = parts;
  const runs: Date[] = [];
  const now = new Date();
  let candidate = new Date(now.getTime() + 60000); // start at next minute
  candidate.setSeconds(0, 0);

  // Simple next run finder for common patterns
  let attempts = 0;
  while (runs.length < count && attempts < 2000) {
    attempts++;
    const m = candidate.getMinutes();
    const h = candidate.getHours();

    let matchMin = min === '*' || min === `*/${candidate.getMinutes() % 5 === 0 ? '5' : ''}` || m === parseInt(min, 10);
    if (min.startsWith('*/')) {
      const step = parseInt(min.replace('*/', ''), 10);
      matchMin = !isNaN(step) && m % step === 0;
    }

    let matchHr = hr === '*' || h === parseInt(hr, 10);
    if (hr.startsWith('*/')) {
      const step = parseInt(hr.replace('*/', ''), 10);
      matchHr = !isNaN(step) && h % step === 0;
    }

    if (matchMin && matchHr) {
      runs.push(new Date(candidate.getTime()));
    }
    candidate = new Date(candidate.getTime() + 60000);
  }

  return runs;
}

// ==========================================
// 10. Multi-format Color Converter (HEX, RGB, HSL, HSV, CMYK)
// ==========================================
export interface ColorConversionResult {
  hex: string;
  rgb: string;
  hsl: string;
  hsv: string;
  cmyk: string;
  r: number;
  g: number;
  b: number;
  isValid: boolean;
}

export function convertColorAll(input: string): ColorConversionResult {
  let clean = input.trim().toLowerCase();

  let r = 0, g = 0, b = 0;
  let isValid = false;

  // 1. Check HEX format
  if (clean.startsWith('#') || /^[0-9a-f]{3,8}$/i.test(clean)) {
    const hex = clean.startsWith('#') ? clean.slice(1) : clean;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
      isValid = true;
    } else if (hex.length === 6 || hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      isValid = true;
    }
  }

  // 2. Check RGB format rgb(r, g, b)
  const rgbMatch = clean.match(/^rgba?\(?\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (!isValid && rgbMatch) {
    r = Math.min(255, parseInt(rgbMatch[1], 10));
    g = Math.min(255, parseInt(rgbMatch[2], 10));
    b = Math.min(255, parseInt(rgbMatch[3], 10));
    isValid = true;
  }

  // Fallback default if not recognized
  if (!isValid) {
    return {
      hex: '#3b82f6',
      rgb: 'rgb(59, 130, 246)',
      hsl: 'hsl(217, 91%, 60%)',
      hsv: 'hsv(217, 76%, 96%)',
      cmyk: 'cmyk(76%, 47%, 0%, 4%)',
      r: 59,
      g: 130,
      b: 246,
      isValid: false,
    };
  }

  // Format HEX
  const hexOut = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

  // Calculate HSL
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h = Math.round(h * 60);
  }

  const hslOut = `hsl(${h}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

  // Calculate HSV
  const v = max;
  const sV = max === 0 ? 0 : (max - min) / max;
  const hsvOut = `hsv(${h}, ${Math.round(sV * 100)}%, ${Math.round(v * 100)}%)`;

  // Calculate CMYK
  const k = 1 - max;
  const c = k === 1 ? 0 : Math.round(((1 - rn - k) / (1 - k)) * 100);
  const m = k === 1 ? 0 : Math.round(((1 - gn - k) / (1 - k)) * 100);
  const y = k === 1 ? 0 : Math.round(((1 - bn - k) / (1 - k)) * 100);
  const cmykOut = `cmyk(${c}%, ${m}%, ${y}%, ${Math.round(k * 100)}%)`;

  return {
    hex: hexOut,
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: hslOut,
    hsv: hsvOut,
    cmyk: cmykOut,
    r,
    g,
    b,
    isValid: true,
  };
}
