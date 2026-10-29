import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import {
  extractPdfMetadata,
  updatePdfMetadata,
  stripPdfMetadata,
} from './pdfMetadataUtils.ts';

test('extractPdfMetadata and updatePdfMetadata read and write properties', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([400, 600]);

  updatePdfMetadata(pdfDoc, {
    title: 'Executive Summary',
    author: 'Alex Mercer',
    subject: 'Financial Projections',
    keywords: ['Finance', '2026', 'Audit'],
  });

  const meta = extractPdfMetadata(pdfDoc);
  assert.equal(meta.title, 'Executive Summary');
  assert.equal(meta.author, 'Alex Mercer');
  assert.equal(meta.subject, 'Financial Projections');
  assert.deepEqual(meta.keywords, ['Finance', '2026', 'Audit']);
  assert.equal(meta.pageCount, 1);
});

test('stripPdfMetadata erases all personal fields', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([400, 600]);

  updatePdfMetadata(pdfDoc, {
    title: 'Private Contract',
    author: 'Sensitive Person',
  });

  stripPdfMetadata(pdfDoc);
  const meta = extractPdfMetadata(pdfDoc);
  assert.equal(meta.title, '');
  assert.equal(meta.author, '');
  assert.equal(meta.subject, '');
  assert.deepEqual(meta.keywords, []);
});
