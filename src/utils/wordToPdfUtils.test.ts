import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrapText, convertParagraphsToPdf, sanitizeWinAnsiText } from './wordToPdfUtils.ts';

test('wrapText wraps long strings into multiple lines according to maxWidth', () => {
  const sentence = 'The quick brown fox jumps over the lazy dog and runs across the wide open green meadow.';
  const lines = wrapText(sentence, 200, 6);
  assert.ok(lines.length > 1, 'Should wrap into multiple lines');
  assert.ok(lines.every((l) => l.length <= 35));
});

test('sanitizeWinAnsiText replaces "≈" (0x2248) and mathematical / Unicode symbols', () => {
  assert.equal(sanitizeWinAnsiText('x ≈ 3.14'), 'x ~= 3.14');
  assert.equal(sanitizeWinAnsiText('a ≠ b and x ≤ 10 and y ≥ 20'), 'a != b and x <= 10 and y >= 20');
  assert.equal(sanitizeWinAnsiText('Price: ₹500 and 100±5'), 'Price: Rs.500 and 100+/-5');
  assert.equal(sanitizeWinAnsiText('“Smart quotes” and ‘single’ — dash…'), '"Smart quotes" and \'single\' -- dash...');
});

test('convertParagraphsToPdf produces valid PDF binary and handles "≈" without WinAnsi errors', async () => {
  const paragraphs = [
    { text: 'Mathematical Formula & Constants (≈ 0x2248 Test)', isHeading: true },
    { text: 'The value of pi is ≈ 3.14159, and e ≈ 2.718.', isHeading: false },
    { text: 'Section 1: Obligations of the Contractor', isHeading: true },
    { text: 'Price is ₹1,000 with ±5% variance. Status: Complete ✔', isHeading: false },
  ];

  const pdfBytes = await convertParagraphsToPdf(paragraphs);
  assert.ok(pdfBytes.length > 500, 'PDF should have valid binary size');
  // Check PDF magic header %PDF-
  assert.equal(pdfBytes[0], 0x25); // %
  assert.equal(pdfBytes[1], 0x50); // P
  assert.equal(pdfBytes[2], 0x44); // D
  assert.equal(pdfBytes[3], 0x46); // F
});

test('convertParagraphsToPdf embeds images successfully into PDF document', async () => {
  const tinyPngDataUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  const paragraphs = [
    { text: 'Document with Embedded Image', isHeading: true },
    { text: 'Here is the diagram below:', isHeading: false },
    { imageDataUrl: tinyPngDataUrl, imageType: 'png' as const },
    { text: 'Figure 1: Sample diagram', isHeading: false },
  ];

  const pdfBytes = await convertParagraphsToPdf(paragraphs);
  assert.ok(pdfBytes.length > 500, 'PDF with embedded image should have valid binary size');
  assert.equal(pdfBytes[0], 0x25);
  assert.equal(pdfBytes[1], 0x50);
});
