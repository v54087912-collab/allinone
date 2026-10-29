import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampRegion,
  applyPixelateToImageData,
  applyBoxBlurToImageData,
} from './blurUtils.ts';

test('clampRegion keeps bounding box strictly within bounds', () => {
  const clamped = clampRegion({ x: -10, y: -20, width: 600, height: 600 }, 500, 400);
  assert.equal(clamped.x, 0);
  assert.equal(clamped.y, 0);
  assert.equal(clamped.width, 500);
  assert.equal(clamped.height, 400);
});

test('clampRegion clamps overflow to image bounds', () => {
  const clamped = clampRegion({ x: 300, y: 200, width: 300, height: 300 }, 400, 300);
  assert.equal(clamped.x, 300);
  assert.equal(clamped.y, 200);
  assert.equal(clamped.width, 100);
  assert.equal(clamped.height, 100);
});

test('applyPixelateToImageData averages pixel colors within blocks', () => {
  // Create a 4x4 mock ImageData buffer
  const width = 4;
  const height = 4;
  const buffer = new Uint8ClampedArray(width * height * 4);

  // Fill top-left 2x2 with red (255, 0, 0, 255) and black
  buffer[0] = 255; buffer[3] = 255; // (0,0)
  buffer[4] = 100; buffer[7] = 255; // (1,0)
  buffer[16] = 50; buffer[19] = 255; // (0,1)
  buffer[20] = 50; buffer[23] = 255; // (1,1)

  const mockImageData = {
    width,
    height,
    data: buffer,
    colorSpace: 'srgb',
  } as ImageData;

  applyPixelateToImageData(mockImageData, { x: 0, y: 0, width: 2, height: 2 }, 2);

  // Expected average R = (255 + 100 + 50 + 50) / 4 = 113.75 -> 114
  assert.equal(buffer[0], 114);
  assert.equal(buffer[4], 114);
  assert.equal(buffer[16], 114);
  assert.equal(buffer[20], 114);
});

test('applyBoxBlurToImageData diffuses sharp pixel edges', () => {
  const width = 5;
  const height = 1;
  const buffer = new Uint8ClampedArray(width * height * 4);

  // Center pixel is white, neighbors black
  buffer[8] = 255; buffer[9] = 255; buffer[10] = 255; buffer[11] = 255; // pixel 2

  const mockImageData = {
    width,
    height,
    data: buffer,
    colorSpace: 'srgb',
  } as ImageData;

  applyBoxBlurToImageData(mockImageData, { x: 0, y: 0, width: 5, height: 1 }, 1);

  // Center pixel should diffuse to neighbors
  assert.ok(buffer[0] === 0); // pixel 0 remains 0
  assert.ok(buffer[4] > 0);   // pixel 1 gets diffused color
  assert.ok(buffer[8] < 255); // pixel 2 decreases from 255
  assert.ok(buffer[12] > 0);  // pixel 3 gets diffused color
});
