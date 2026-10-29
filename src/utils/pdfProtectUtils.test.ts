import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePasswordStrength,
  encryptPdfBytes,
  decryptPdfBytes,
} from './pdfProtectUtils.ts';

test('calculatePasswordStrength evaluates passwords accurately', () => {
  assert.equal(calculatePasswordStrength('').label, 'Weak');
  assert.equal(calculatePasswordStrength('12345').label, 'Weak');
  assert.equal(calculatePasswordStrength('Pass1234').label, 'Good');
  assert.equal(calculatePasswordStrength('Strong#SecretP@ss99').label, 'Strong');
});

test('encryptPdfBytes and decryptPdfBytes round-trip successfully with correct password', async () => {
  const dummyPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37]); // %PDF-1.7
  const password = 'CorrectHorseBatteryStaple123!';

  const encrypted = await encryptPdfBytes(dummyPdf, password);
  assert.ok(encrypted.length > dummyPdf.length);

  const decrypted = await decryptPdfBytes(encrypted, password);
  assert.deepEqual(decrypted, dummyPdf);
});

test('decryptPdfBytes throws error when incorrect password is provided', async () => {
  const dummyPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
  const encrypted = await encryptPdfBytes(dummyPdf, 'RealPassword123');

  await assert.rejects(async () => {
    await decryptPdfBytes(encrypted, 'WrongPassword456');
  }, /Incorrect password/);
});
