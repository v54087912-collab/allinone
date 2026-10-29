import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMergedLayout, ImageDimension } from './mergerUtils';

test('calculateMergedLayout handles empty array', () => {
  const result = calculateMergedLayout([], { direction: 'vertical', spacing: 10 });
  assert.equal(result.totalWidth, 0);
  assert.equal(result.totalHeight, 0);
  assert.equal(result.positions.length, 0);
});

test('calculateMergedLayout vertical stacking calculates height and spacing', () => {
  const images: ImageDimension[] = [
    { id: '1', width: 200, height: 100 },
    { id: '2', width: 200, height: 150 },
  ];

  const result = calculateMergedLayout(images, {
    direction: 'vertical',
    spacing: 20,
    matchDimensions: false,
  });

  assert.equal(result.totalWidth, 200);
  // height: 100 + 20 (spacing) + 150 = 270
  assert.equal(result.totalHeight, 270);
  assert.equal(result.positions[0].y, 0);
  assert.equal(result.positions[1].y, 120);
});

test('calculateMergedLayout horizontal stitching calculates width and spacing', () => {
  const images: ImageDimension[] = [
    { id: '1', width: 300, height: 200 },
    { id: '2', width: 400, height: 200 },
  ];

  const result = calculateMergedLayout(images, {
    direction: 'horizontal',
    spacing: 15,
    matchDimensions: false,
  });

  // width: 300 + 15 + 400 = 715
  assert.equal(result.totalWidth, 715);
  assert.equal(result.totalHeight, 200);
  assert.equal(result.positions[0].x, 0);
  assert.equal(result.positions[1].x, 315);
});

test('calculateMergedLayout grid layout places elements across rows and columns', () => {
  const images: ImageDimension[] = [
    { id: '1', width: 100, height: 100 },
    { id: '2', width: 100, height: 100 },
    { id: '3', width: 100, height: 100 },
    { id: '4', width: 100, height: 100 },
  ];

  const result = calculateMergedLayout(images, {
    direction: 'grid',
    gridColumns: 2,
    spacing: 10,
  });

  // 2 cols of 100 + 10 gap = 210
  assert.equal(result.totalWidth, 210);
  // 2 rows of 100 + 10 gap = 210
  assert.equal(result.totalHeight, 210);
  assert.equal(result.positions.length, 4);
  assert.equal(result.positions[0].x, 0);
  assert.equal(result.positions[0].y, 0);
  assert.equal(result.positions[1].x, 110);
  assert.equal(result.positions[1].y, 0);
  assert.equal(result.positions[2].x, 0);
  assert.equal(result.positions[2].y, 110);
  assert.equal(result.positions[3].x, 110);
  assert.equal(result.positions[3].y, 110);
});
