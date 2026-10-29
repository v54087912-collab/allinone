import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePageRange,
  validatePageRange,
  chunkPagesEveryN,
  calculateImagePlacement,
  calculatePdfCropBox,
  generateSplitFilename,
  isJpegBytes,
  isPngBytes,
} from './pdfUtils.ts';

test('parsePageRange handles empty or null range as all pages', () => {
  const result = parsePageRange('', 5);
  assert.deepEqual(result, [1, 2, 3, 4, 5]);

  const nullResult = parsePageRange('   ', 3);
  assert.deepEqual(nullResult, [1, 2, 3]);
});

test('parsePageRange handles single pages and comma-separated lists', () => {
  const result = parsePageRange('1, 3, 5', 10);
  assert.deepEqual(result, [1, 3, 5]);
});

test('parsePageRange handles page intervals and combinations', () => {
  const result = parsePageRange('1-3, 5, 8-10', 10);
  assert.deepEqual(result, [1, 2, 3, 5, 8, 9, 10]);
});

test('parsePageRange clamps to totalPages and ignores out-of-bounds', () => {
  const result = parsePageRange('0, 2, 5-15', 8);
  assert.deepEqual(result, [2, 5, 6, 7, 8]);
});

test('parsePageRange eliminates duplicates and sorts ascending', () => {
  const result = parsePageRange('5, 1, 3, 1-4, 5', 6);
  assert.deepEqual(result, [1, 2, 3, 4, 5]);
});

test('validatePageRange detects invalid syntax and characters', () => {
  const check = validatePageRange('1-3, abc', 10);
  assert.equal(check.valid, false);
  assert.match(check.error || '', /Only numbers/);
});

test('validatePageRange validates out-of-range correctly', () => {
  const check = validatePageRange('12-20', 5);
  assert.equal(check.valid, false);
  assert.match(check.error || '', /No valid pages/);
});

test('chunkPagesEveryN splits pages into equal sized parts', () => {
  const chunks = chunkPagesEveryN(7, 3);
  assert.deepEqual(chunks, [
    [1, 2, 3],
    [4, 5, 6],
    [7]
  ]);
});

test('calculateImagePlacement fit to image matches image dimensions with 0 margins', () => {
  const placement = calculateImagePlacement(800, 600, {
    pageSize: 'fit',
    orientation: 'auto',
    margin: 'normal',
    fit: 'contain',
  });
  assert.equal(placement.pageWidth, 800);
  assert.equal(placement.pageHeight, 600);
  assert.equal(placement.width, 800);
  assert.equal(placement.height, 600);
  assert.equal(placement.x, 0);
  assert.equal(placement.y, 0);
});

test('calculateImagePlacement auto orientation switches to landscape for wide images', () => {
  const placement = calculateImagePlacement(1200, 600, {
    pageSize: 'a4',
    orientation: 'auto',
    margin: 'none',
    fit: 'contain',
  });
  // A4 portrait is 595.28 x 841.89, landscape is 841.89 x 595.28
  assert.ok(placement.pageWidth > placement.pageHeight, 'Page should be landscape');
  assert.ok(placement.width <= placement.pageWidth);
  assert.ok(placement.height <= placement.pageHeight);
});

test('calculateImagePlacement centers image with margins', () => {
  const placement = calculateImagePlacement(400, 400, {
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 'normal', // 36 pt
    fit: 'contain',
  });
  assert.equal(placement.pageWidth, 595.28);
  assert.equal(placement.pageHeight, 841.89);
  // Drawing area width = 595.28 - 72 = 523.28; height = 841.89 - 72 = 769.89
  // Aspect ratio is 1:1, so max square is 523.28 x 523.28
  assert.ok(Math.abs(placement.width - 523.28) < 0.1);
  assert.ok(Math.abs(placement.height - 523.28) < 0.1);
  assert.ok(placement.x >= 36);
  assert.ok(placement.y > 36);
});

test('calculatePdfCropBox transforms screen coords to bottom-left PDF coords', () => {
  const mediaBox = { x: 0, y: 0, width: 600, height: 800 };
  // Crop top half of screen: x: 0..1, y: 0..0.5
  const normCrop = { x: 0, y: 0, width: 1, height: 0.5 };
  const cropBox = calculatePdfCropBox(mediaBox, normCrop);

  assert.equal(cropBox.x, 0);
  assert.equal(cropBox.width, 600);
  // In PDF, top half corresponds to Y from 400 to 800
  assert.equal(cropBox.y, 400);
  assert.equal(cropBox.height, 400);
});

test('calculatePdfCropBox handles non-zero mediaBox origin', () => {
  const mediaBox = { x: 50, y: 50, width: 500, height: 700 };
  const normCrop = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
  const cropBox = calculatePdfCropBox(mediaBox, normCrop);

  assert.equal(cropBox.x, 100);
  assert.equal(cropBox.width, 400);
  assert.equal(cropBox.height, 560);
  // pdfY = 50 + 700 * (1 - 0.9) = 50 + 70 = 120
  assert.equal(cropBox.y, 120);
});

test('generateSplitFilename formats single page, ranges, and parts correctly', () => {
  assert.equal(generateSplitFilename('report.pdf', [3]), 'report_page_3.pdf');
  assert.equal(generateSplitFilename('invoice.pdf', [1, 2, 3]), 'invoice_pages_1-3.pdf');
  assert.equal(generateSplitFilename('contract.pdf', [1, 4, 7]), 'contract_extracted.pdf');
  assert.equal(generateSplitFilename('contract.pdf', [1, 4, 7], 1, 3), 'contract_part_2_of_3.pdf');
});

test('isJpegBytes detects JPEG SOI marker and rejects non-JPEG', () => {
  assert.equal(isJpegBytes(new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0])), true);
  assert.equal(isJpegBytes(new Uint8Array([0xFF, 0xD8])), true);
  assert.equal(isJpegBytes(new Uint8Array([0x89, 0x50, 0x4E, 0x47])), false);
  assert.equal(isJpegBytes(new Uint8Array([0x52, 0x49, 0x46, 0x46])), false); // RIFF (WebP)
  assert.equal(isJpegBytes(new Uint8Array([0xFF])), false);
  assert.equal(isJpegBytes(new Uint8Array([])), false);
});

test('isPngBytes detects PNG signature and rejects non-PNG', () => {
  const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  assert.equal(isPngBytes(pngHeader), true);
  assert.equal(isPngBytes(new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0])), false);
  assert.equal(isPngBytes(new Uint8Array([0x89, 0x50, 0x4E])), false);
  assert.equal(isPngBytes(new Uint8Array([])), false);
});
