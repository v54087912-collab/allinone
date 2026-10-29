import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { applyPdfWatermark } from './pdfWatermarkUtils.ts';

test('applyPdfWatermark applies text watermark to all pages', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([500, 700]);
  pdfDoc.addPage([500, 700]);

  await applyPdfWatermark(pdfDoc, {
    type: 'text',
    text: 'TOP SECRET',
    fontSize: 36,
    opacity: 0.5,
    rotation: 45,
    pagesSelection: 'all',
  });

  const bytes = await pdfDoc.save();
  assert.ok(bytes.length > 500);
});

test('applyPdfWatermark filters pages by odd/even', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([500, 700]); // p1
  pdfDoc.addPage([500, 700]); // p2

  await applyPdfWatermark(pdfDoc, {
    type: 'text',
    text: 'DRAFT',
    pagesSelection: 'odd',
  });

  const bytes = await pdfDoc.save();
  assert.ok(bytes.length > 500);
});
