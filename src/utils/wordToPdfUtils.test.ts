import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrapText, convertParagraphsToPdf } from './wordToPdfUtils.ts';

test('wrapText wraps long strings into multiple lines according to maxWidth', () => {
  const sentence = 'The quick brown fox jumps over the lazy dog and runs across the wide open green meadow.';
  const lines = wrapText(sentence, 200, 6);
  assert.ok(lines.length > 1, 'Should wrap into multiple lines');
  assert.ok(lines.every((l) => l.length <= 35));
});

test('convertParagraphsToPdf produces valid PDF binary', async () => {
  const paragraphs = [
    { text: 'Company Confidential Agreement', isHeading: true },
    { text: 'This agreement is entered into by and between the parties.', isHeading: false },
    { text: 'Section 1: Obligations of the Contractor', isHeading: true },
    { text: 'The contractor shall provide engineering services as requested.', isHeading: false },
  ];

  const pdfBytes = await convertParagraphsToPdf(paragraphs);
  assert.ok(pdfBytes.length > 500, 'PDF should have valid binary size');
  // Check PDF magic header %PDF-
  assert.equal(pdfBytes[0], 0x25); // %
  assert.equal(pdfBytes[1], 0x50); // P
  assert.equal(pdfBytes[2], 0x44); // D
  assert.equal(pdfBytes[3], 0x46); // F
});
