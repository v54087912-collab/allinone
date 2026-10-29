import test from 'node:test';
import assert from 'node:assert';
import {
  generatePassword,
  calculateEntropy,
  generateUuids,
  encodeBase64,
  decodeBase64,
  encodeUriText,
  decodeUriText,
  parseUrlComponents,
} from './cryptoUtils.ts';

test('generatePassword creates password of requested length and character subsets', () => {
  const pwd = generatePassword({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  assert.strictEqual(pwd.length, 20);
  assert.ok(/[A-Z]/.test(pwd) || /[a-z]/.test(pwd) || /[0-9]/.test(pwd));
});

test('calculateEntropy scores strong passwords higher than short ones', () => {
  const weak = calculateEntropy('12345');
  const strong = calculateEntropy('K9#mQ2$xP9!vL5*z');

  assert.ok(strong.entropy > weak.entropy);
  assert.ok(strong.score >= weak.score);
});

test('generateUuids creates standard v4 UUIDs', () => {
  const uuids = generateUuids(5, 'standard');
  assert.strictEqual(uuids.length, 5);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert.ok(uuidRegex.test(uuids[0]));
});

test('encodeBase64 and decodeBase64 round trip text with unicode support', () => {
  const original = 'Hello World! 🚀 Привет мир';
  const encoded = encodeBase64(original);
  const decoded = decodeBase64(encoded);

  assert.strictEqual(decoded, original);
});

test('encodeUriText and decodeUriText handle special characters', () => {
  const raw = 'name=John Doe & Company?#id=10';
  const encoded = encodeUriText(raw);
  assert.ok(encoded.includes('%20'));
  assert.strictEqual(decodeUriText(encoded), raw);
});

test('parseUrlComponents decomposes full URLs into components and query params', () => {
  const parsed = parseUrlComponents('https://example.com:8080/path/to/page?user=alice&lang=en#heading');
  assert.ok(parsed);
  assert.strictEqual(parsed.protocol, 'https:');
  assert.strictEqual(parsed.host, 'example.com:8080');
  assert.strictEqual(parsed.pathname, '/path/to/page');
  assert.strictEqual(parsed.params.length, 2);
  assert.strictEqual(parsed.params[0].key, 'user');
  assert.strictEqual(parsed.params[0].value, 'alice');
});
