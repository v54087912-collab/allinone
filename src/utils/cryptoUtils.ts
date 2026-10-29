/**
 * Cryptographic and Encoding Utilities for Password Generator, UUID Generator,
 * URL Encoder/Decoder, and Base64 Encoder/Decoder.
 */

export interface PasswordConfig {
  length: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
  excludeAmbiguous?: boolean;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = /[il1Lo0O]/g;

/**
 * Generates a cryptographically strong random password using crypto.getRandomValues
 */
export function generatePassword(config: PasswordConfig): string {
  let charset = '';
  if (config.uppercase ?? true) charset += UPPERCASE;
  if (config.lowercase ?? true) charset += LOWERCASE;
  if (config.numbers ?? true) charset += NUMBERS;
  if (config.symbols ?? true) charset += SYMBOLS;

  if (config.excludeAmbiguous) {
    charset = charset.replace(AMBIGUOUS, '');
  }

  if (!charset) {
    charset = LOWERCASE + NUMBERS;
  }

  const length = Math.max(4, Math.min(config.length || 16, 128));
  const randomBytes = new Uint32Array(length);
  crypto.getRandomValues(randomBytes);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

/**
 * Calculates password entropy in bits and strength category
 */
export function calculateEntropy(password: string): { entropy: number; score: number; label: string } {
  if (!password) return { entropy: 0, score: 0, label: 'Empty' };

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  const entropy = Math.round(password.length * Math.log2(poolSize || 1));

  let score = 0;
  let label = 'Very Weak';
  if (entropy >= 80) {
    score = 4;
    label = 'Very Strong';
  } else if (entropy >= 60) {
    score = 3;
    label = 'Strong';
  } else if (entropy >= 40) {
    score = 2;
    label = 'Medium';
  } else if (entropy >= 25) {
    score = 1;
    label = 'Weak';
  }

  return { entropy, score, label };
}

/**
 * Generates UUID v4 strings
 */
export function generateUuids(
  quantity = 1,
  format: 'standard' | 'nohyphen' | 'uppercase' = 'standard'
): string[] {
  const count = Math.max(1, Math.min(quantity, 100));
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    let id: string = crypto.randomUUID();
    if (format === 'nohyphen') {
      id = id.replace(/-/g, '');
    } else if (format === 'uppercase') {
      id = id.toUpperCase();
    }
    results.push(id);
  }

  return results;
}

/**
 * Base64 encoding with UTF-8 byte array support
 */
export function encodeBase64(str: string): string {
  const enc = new TextEncoder();
  const bytes = enc.encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

/**
 * Base64 decoding with UTF-8 byte array support
 */
export function decodeBase64(base64: string): string {
  const clean = base64.trim().replace(/\s/g, '');
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  const dec = new TextDecoder();
  return dec.decode(bytes);
}

/**
 * Encodes text for URI component
 */
export function encodeUriText(str: string): string {
  return encodeURIComponent(str);
}

/**
 * Decodes URI component
 */
export function decodeUriText(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

export interface ParsedUrl {
  protocol: string;
  host: string;
  pathname: string;
  search: string;
  hash: string;
  params: Array<{ key: string; value: string }>;
}

export function parseUrlComponents(urlStr: string): ParsedUrl | null {
  try {
    const url = new URL(urlStr.trim());
    const params: Array<{ key: string; value: string }> = [];
    url.searchParams.forEach((val, key) => {
      params.push({ key, value: val });
    });

    return {
      protocol: url.protocol,
      host: url.host,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      params,
    };
  } catch {
    return null;
  }
}
