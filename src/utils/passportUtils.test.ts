import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mmToPixels,
  calculatePrintSheetLayout,
  PASSPORT_STANDARDS,
} from './passportUtils';

test('mmToPixels accurately calculates pixel dimensions for given DPI', () => {
  // 25.4 mm = 1 inch -> at 300 DPI should be 300 px
  assert.equal(mmToPixels(25.4, 300), 300);
  // 50.8 mm (2 inches) -> 600 px at 300 DPI
  assert.equal(mmToPixels(50.8, 300), 600);
});

test('PASSPORT_STANDARDS defines major country requirements', () => {
  assert.ok(PASSPORT_STANDARDS.us);
  assert.ok(PASSPORT_STANDARDS.uk_eu);
  assert.ok(PASSPORT_STANDARDS.in);
  assert.ok(PASSPORT_STANDARDS.ca);
  assert.equal(PASSPORT_STANDARDS.us.widthMm, 50.8);
  assert.equal(PASSPORT_STANDARDS.uk_eu.widthMm, 35);
  assert.equal(PASSPORT_STANDARDS.uk_eu.heightMm, 45);
});

test('calculatePrintSheetLayout calculates 4x6 print sheet for US 2x2 photos', () => {
  const photoW = mmToPixels(50.8, 300); // 600px
  const photoH = mmToPixels(50.8, 300); // 600px

  const layout = calculatePrintSheetLayout(photoW, photoH, '4x6', 300);
  // 4x6 sheet at 300 DPI is approx 1800 x 1200 px
  assert.ok(layout.sheetWidthPx >= 1700);
  assert.ok(layout.sheetHeightPx >= 1100);
  // Fits 2x1 or 2x2 depending on margins
  assert.ok(layout.totalPhotos >= 2);
  assert.equal(layout.positions.length, layout.totalPhotos);
});

test('calculatePrintSheetLayout calculates A4 document sheet with multiple photos', () => {
  const photoW = mmToPixels(35, 300);
  const photoH = mmToPixels(45, 300);

  const layout = calculatePrintSheetLayout(photoW, photoH, 'a4', 300);
  assert.ok(layout.cols >= 4);
  assert.ok(layout.rows >= 5);
  assert.ok(layout.totalPhotos >= 20);
});
