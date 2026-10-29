import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGridSlices,
  calculateFixedTileSlices,
  generateSliceFilename,
} from './splitterUtils.ts';

test('calculateGridSlices splits into exact rows and columns', () => {
  const slices = calculateGridSlices(900, 600, 2, 3);
  assert.equal(slices.length, 6);

  // Check first slice
  assert.deepEqual(slices[0], {
    index: 0,
    row: 0,
    col: 0,
    x: 0,
    y: 0,
    width: 300,
    height: 300,
  });

  // Check last slice
  assert.deepEqual(slices[5], {
    index: 5,
    row: 1,
    col: 2,
    x: 600,
    y: 300,
    width: 300,
    height: 300,
  });
});

test('calculateGridSlices absorbs rounding remainder in last row/col', () => {
  const slices = calculateGridSlices(100, 100, 3, 3);
  assert.equal(slices.length, 9);
  // Column widths: 33, 33, 34
  assert.equal(slices[0].width, 33);
  assert.equal(slices[1].width, 33);
  assert.equal(slices[2].width, 34);
});

test('calculateFixedTileSlices tiles image correctly', () => {
  const slices = calculateFixedTileSlices(64, 64, 32, 32);
  assert.equal(slices.length, 4);
  assert.equal(slices[0].width, 32);
  assert.equal(slices[0].height, 32);
});

test('generateSliceFilename creates numbered filenames', () => {
  assert.equal(
    generateSliceFilename('photo.jpg', 0, 1, 1, 'jpg'),
    'photo_part_02_r1_c2.jpg'
  );
  assert.equal(
    generateSliceFilename('banner.png', 2, 2, 8, 'png'),
    'banner_part_09_r3_c3.png'
  );
});
