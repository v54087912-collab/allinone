import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateOcrStats, sanitizeOcrText } from './ocrUtils.ts';

test('calculateOcrStats counts words, characters, and lines accurately', () => {
  const sample = `Invoice #1092
Client: Acme Corp
Total Due: $450.00`;

  const stats = calculateOcrStats(sample);
  assert.equal(stats.wordCount, 8); // Invoice, #1092, Client:, Acme, Corp, Total, Due:, $450.00
  assert.equal(stats.lineCount, 3);
  assert.ok(stats.charCount > 30);
});

test('calculateOcrStats returns zeros for empty strings', () => {
  assert.deepEqual(calculateOcrStats('   \n  '), {
    wordCount: 0,
    charCount: 0,
    lineCount: 0,
  });
});

test('sanitizeOcrText collapses duplicate spaces and removes control characters', () => {
  const dirty = 'Hello \x05 World!   Line two.\n\n\n\nLine three.';
  const clean = sanitizeOcrText(dirty);
  assert.equal(clean, 'Hello World! Line two.\n\nLine three.');
});
