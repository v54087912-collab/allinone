import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findNearestColor,
  applyBayerDither,
  PIXEL_PALETTES,
} from './pixelArtUtils.ts';

test('findNearestColor matches exact colors in palette', () => {
  const palette = PIXEL_PALETTES.gameboy;
  const match = findNearestColor(15, 56, 15, palette);
  assert.deepEqual(match, { r: 15, g: 56, b: 15 });
});

test('findNearestColor maps near-green to closest Game Boy green shade', () => {
  const palette = PIXEL_PALETTES.gameboy;
  // Near brightest green (155, 188, 15)
  const match = findNearestColor(150, 190, 20, palette);
  assert.deepEqual(match, { r: 155, g: 188, b: 15 });
});

test('findNearestColor handles monochrome black and white', () => {
  const palette = PIXEL_PALETTES.monochrome;
  assert.deepEqual(findNearestColor(20, 30, 40, palette), { r: 0, g: 0, b: 0 });
  assert.deepEqual(findNearestColor(200, 210, 220, palette), { r: 255, g: 255, b: 255 });
});

test('applyBayerDither clamps values between 0 and 255', () => {
  const dithered = applyBayerDither(250, 10, 128, 0, 0, 32);
  assert.ok(dithered.r <= 255);
  assert.ok(dithered.g >= 0);
  assert.ok(dithered.b >= 0 && dithered.b <= 255);
});
