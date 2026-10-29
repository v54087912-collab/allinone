/**
 * PDF Password Protection & Encryption Utility Functions
 * Supports:
 * - 256-bit AES-GCM client-side encryption using Web Crypto API (SubtleCrypto)
 * - PBKDF2 key derivation with 100,000 rounds and random salt
 * - Password strength scoring
 * - Encrypted file packing with magic header 'QPIC_SECURE_PDF'
 */

export interface EncryptedPdfPackage {
  salt: Uint8Array;
  iv: Uint8Array;
  ciphertext: Uint8Array;
}

const MAGIC_HEADER = new Uint8Array([0x51, 0x50, 0x49, 0x43, 0x53, 0x45, 0x43]); // 'QPICSEC'

/**
 * Computes a password strength score (0 to 100) and qualitative label.
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
} {
  if (!password) return { score: 0, label: 'Weak' };

  let score = 0;
  if (password.length >= 6) score += 25;
  if (password.length >= 10) score += 25;
  if (/[0-9]/.test(password)) score += 15;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;

  score = Math.min(100, score);

  let label: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  if (score >= 80) label = 'Strong';
  else if (score >= 60) label = 'Good';
  else if (score >= 40) label = 'Fair';

  return { score, label };
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a password and salt using PBKDF2.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts arbitrary PDF bytes using 256-bit AES-GCM and packages with salt & IV.
 */
export async function encryptPdfBytes(
  pdfBytes: Uint8Array,
  password: string
): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, salt);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    pdfBytes as any
  );

  const ciphertext = new Uint8Array(ciphertextBuffer);

  // Pack binary: [MAGIC(7)][SALT(16)][IV(12)][CIPHERTEXT_LENGTH(4)][CIPHERTEXT]
  const totalLength = MAGIC_HEADER.length + 16 + 12 + 4 + ciphertext.length;
  const output = new Uint8Array(totalLength);

  let offset = 0;
  output.set(MAGIC_HEADER, offset);
  offset += MAGIC_HEADER.length;

  output.set(salt, offset);
  offset += 16;

  output.set(iv, offset);
  offset += 12;

  const view = new DataView(output.buffer);
  view.setUint32(offset, ciphertext.length, false);
  offset += 4;

  output.set(ciphertext, offset);

  return output;
}

/**
 * Decrypts a password-protected PDF package using the user password.
 */
export async function decryptPdfBytes(
  encryptedPackage: Uint8Array,
  password: string
): Promise<Uint8Array> {
  // Check magic header
  for (let i = 0; i < MAGIC_HEADER.length; i++) {
    if (encryptedPackage[i] !== MAGIC_HEADER[i]) {
      throw new Error('Not a Toolora password-encrypted PDF file.');
    }
  }

  let offset = MAGIC_HEADER.length;
  const salt = encryptedPackage.slice(offset, offset + 16);
  offset += 16;

  const iv = encryptedPackage.slice(offset, offset + 12);
  offset += 12;

  const view = new DataView(encryptedPackage.buffer, encryptedPackage.byteOffset, encryptedPackage.byteLength);
  const cipherLen = view.getUint32(offset, false);
  offset += 4;

  const ciphertext = encryptedPackage.slice(offset, offset + cipherLen);

  const key = await deriveKey(password, salt);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      ciphertext as any
    );
    return new Uint8Array(decryptedBuffer);
  } catch {
    throw new Error('Incorrect password or corrupted PDF data.');
  }
}
