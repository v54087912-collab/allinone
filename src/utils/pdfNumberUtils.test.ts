import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import {
  formatPageNumberText,
  calculatePageNumberCoords,
  stampPageNumbers,
} from './pdfNumberUtils.ts';

test('formatPageNumberText replaces tokens correctly', () => {
  assert.equal(formatPageNumberText('Page {page} of {total}', 2, 10), 'Page 2 of 10');
  assert.equal(formatPageNumberText('{n}', 5, 20), '5');
  assert.equal(formatPageNumberText('- {page} -', 1, 3), '- 1 -');
});

test('calculatePageNumberCoords calculates bottom-center and bottom-right correctly', () => {
  const pW = 600;
  const pH = 800;
  const tW = 60;
  const tH = 12;

  const bc = calculatePageNumberCoords(pW, pH, tW, tH, 'bottom-center', 30);
  assert.equal(bc.x, (600 - 60) / 2);
  assert.equal(bc.y, 30);

  const br = calculatePageNumberCoords(pW, pH, tW, tH, 'bottom-right', 40);
  assert.equal(br.x, 600 - 60 - 40);
  assert.equal(br.y, 40);
});

test('stampPageNumbers applies numbers to selected pages', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([500, 700]);
  pdfDoc.addPage([500, 700]);
  pdfDoc.addPage([500, 700]);

  await stampPageNumbers(pdfDoc, {
    format: 'Page {page} of {total}',
    position: 'bottom-center',
    fontSize: 10,
    margin: 30,
    startNumber: 1,
    pagesRange: '2-3', // skip first page
  });

  const saved = await pdfDoc.save();
  assert.ok(saved.length > 500);
});
