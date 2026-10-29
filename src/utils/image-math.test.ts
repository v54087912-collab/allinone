/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAspectRatioValue,
  calculateInitialCropBox,
  clampCropBox,
  calculateDownscaledDimensions,
  generateCropFilename,
  formatBytes,
  calculateSavings,
  generateOutputFilename,
} from './image-math';

test('getAspectRatioValue returns correct ratio values', () => {
  assert.equal(getAspectRatioValue('1:1'), 1);
  assert.equal(getAspectRatioValue('16:9'), 16 / 9);
  assert.equal(getAspectRatioValue('9:16'), 9 / 16);
  assert.equal(getAspectRatioValue('4:5'), 0.8);
  assert.equal(getAspectRatioValue('passport'), 35 / 45);
  assert.equal(getAspectRatioValue('custom'), null);
});

test('calculateInitialCropBox centers crop within bounds', () => {
  const box1 = calculateInitialCropBox(1920, 1080, '1:1');
  assert.equal(box1.width, box1.height);
  assert.ok(box1.x >= 0);
  assert.ok(box1.y >= 0);
  assert.ok(box1.x + box1.width <= 1920);
  assert.ok(box1.y + box1.height <= 1080);
});

test('calculateDownscaledDimensions clamps maximum side to 1500px', () => {
  // Already small image
  const small = calculateDownscaledDimensions(800, 600, 1500);
  assert.equal(small.scaled, false);
  assert.equal(small.width, 800);
  assert.equal(small.height, 600);

  // Large landscape image 4000x3000
  const largeLandscape = calculateDownscaledDimensions(4000, 3000, 1500);
  assert.equal(largeLandscape.scaled, true);
  assert.equal(largeLandscape.width, 1500);
  assert.equal(largeLandscape.height, 1125);

  // Large portrait image 2000x6000
  const largePortrait = calculateDownscaledDimensions(2000, 6000, 1500);
  assert.equal(largePortrait.scaled, true);
  assert.equal(largePortrait.height, 1500);
  assert.equal(largePortrait.width, 500);
});

test('generateCropFilename generates clean indexed filenames for multiple crops', () => {
  assert.equal(generateCropFilename('vacation.jpg', 1, 'jpg'), 'vacation-crop-1.jpg');
  assert.equal(generateCropFilename('portrait.png', 2, 'jpg'), 'portrait-crop-2.jpg');
  assert.equal(generateCropFilename('banner', 3, 'webp'), 'banner-crop-3.webp');
  assert.equal(generateCropFilename('family.jpg', 1, 'jpg', '1:1'), 'family-crop-1-1x1.jpg');
  assert.equal(generateCropFilename('header.png', 2, 'webp', '16:9'), 'header-crop-2-16x9.webp');
});

test('clampCropBox ensures crop does not overflow image bounds', () => {
  const clamped = clampCropBox({ x: 950, y: 950, width: 200, height: 200 }, 1000, 1000);
  assert.ok(clamped.x + clamped.width <= 1000);
  assert.ok(clamped.y + clamped.height <= 1000);
});

test('formatBytes formats numbers properly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(500), '500 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(250 * 1024), '250 KB');
  assert.equal(formatBytes(2.5 * 1024 * 1024), '2.5 MB');
});

test('calculateSavings computes savings accurately', () => {
  assert.equal(calculateSavings(1000, 250), 75);
  assert.equal(calculateSavings(500, 500), 0);
});

test('calculateDownscaledDimensions supports various max dimension limits', () => {
  // Max 2048px
  const res2048 = calculateDownscaledDimensions(4096, 2048, 2048);
  assert.equal(res2048.scaled, true);
  assert.equal(res2048.width, 2048);
  assert.equal(res2048.height, 1024);

  // Max 1024px
  const res1024 = calculateDownscaledDimensions(1920, 1080, 1024);
  assert.equal(res1024.scaled, true);
  assert.equal(res1024.width, 1024);
  assert.equal(res1024.height, Math.round(1080 * (1024 / 1920)));

  // Max 0 (disabled / original resolution)
  const res0 = calculateDownscaledDimensions(3840, 2160, 0);
  assert.equal(res0.scaled, false);
  assert.equal(res0.width, 3840);
  assert.equal(res0.height, 2160);
});

test('calculateInitialCropBox handles all presets accurately', () => {
  const presets = ['1:1', '4:5', '16:9', '9:16', 'passport', 'custom'] as const;
  for (const preset of presets) {
    const box = calculateInitialCropBox(2000, 1500, preset);
    assert.ok(box.width > 0, `Width > 0 for ${preset}`);
    assert.ok(box.height > 0, `Height > 0 for ${preset}`);
    assert.ok(box.x >= 0, `X >= 0 for ${preset}`);
    assert.ok(box.y >= 0, `Y >= 0 for ${preset}`);
    assert.ok(box.x + box.width <= 2000, `Bounds X for ${preset}`);
    assert.ok(box.y + box.height <= 1500, `Bounds Y for ${preset}`);
  }
});
