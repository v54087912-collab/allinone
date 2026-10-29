import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import {
  normalizeRotation,
  rotateAllPages,
  applyPageRotations,
} from './pdfRotateUtils.ts';

test('normalizeRotation normalizes arbitrary angles to 0, 90, 180, 270', () => {
  assert.equal(normalizeRotation(0), 0);
  assert.equal(normalizeRotation(90), 90);
  assert.equal(normalizeRotation(180), 180);
  assert.equal(normalizeRotation(270), 270);
  assert.equal(normalizeRotation(360), 0);
  assert.equal(normalizeRotation(-90), 270);
  assert.equal(normalizeRotation(450), 90);
  assert.equal(normalizeRotation(89), 90);
});

test('rotateAllPages rotates all pages by delta angle', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([500, 700]);
  pdfDoc.addPage([500, 700]);

  rotateAllPages(pdfDoc, 90);

  const pages = pdfDoc.getPages();
  assert.equal(pages[0].getRotation().angle, 90);
  assert.equal(pages[1].getRotation().angle, 90);
});

test('applyPageRotations sets specific page rotations accurately', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([500, 700]);
  pdfDoc.addPage([500, 700]);

  const map = new Map<number, number>();
  map.set(0, 180);
  map.set(1, 270);

  applyPageRotations(pdfDoc, map);

  const pages = pdfDoc.getPages();
  assert.equal(pages[0].getRotation().angle, 180);
  assert.equal(pages[1].getRotation().angle, 270);
});
