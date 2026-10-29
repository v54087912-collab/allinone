import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWatermarkPosition,
  calculateTiledPositions,
  hexToRgba,
  buildCanvasFont,
} from './watermarkUtils.ts';

test('calculateWatermarkPosition computes 9-grid coordinates correctly', () => {
  const imgW = 1000;
  const imgH = 800;
  const wmW = 200;
  const wmH = 50;
  const padding = 20;

  // Top-Left
  assert.deepEqual(
    calculateWatermarkPosition(imgW, imgH, wmW, wmH, 'top-left', padding),
    { x: 20, y: 20 }
  );

  // Center
  assert.deepEqual(
    calculateWatermarkPosition(imgW, imgH, wmW, wmH, 'center', padding),
    { x: 400, y: 375 }
  );

  // Bottom-Right
  assert.deepEqual(
    calculateWatermarkPosition(imgW, imgH, wmW, wmH, 'bottom-right', padding),
    { x: 780, y: 730 }
  );
});

test('calculateTiledPositions generates staggered grid covering canvas', () => {
  const points = calculateTiledPositions(400, 300, 200, 150);
  assert.ok(points.length > 4, 'Should generate multiple tile points');
  // First row vs second row offset
  assert.ok(points.some((p) => p.x < 0), 'Should extend beyond left edge for full rotation coverage');
});

test('hexToRgba formats rgba strings accurately', () => {
  assert.equal(hexToRgba('#ffffff', 0.5), 'rgba(255, 255, 255, 0.5)');
  assert.equal(hexToRgba('#000000', 1), 'rgba(0, 0, 0, 1)');
  assert.equal(hexToRgba('#ff0000', 0.8), 'rgba(255, 0, 0, 0.8)');
  assert.equal(hexToRgba('fff', 0.2), 'rgba(255, 255, 255, 0.2)');
});

test('buildCanvasFont constructs valid CSS font string', () => {
  assert.equal(buildCanvasFont(24, 'Inter', false, false), '24px Inter');
  assert.equal(buildCanvasFont(32, 'Arial', true, false), 'bold 32px Arial');
  assert.equal(buildCanvasFont(18, 'Courier', true, true), 'italic bold 18px Courier');
});
