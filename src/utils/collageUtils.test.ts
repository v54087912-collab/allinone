import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCollageSlots,
  calculateCoverCrop,
  COLLAGE_ASPECT_RATIOS,
} from './collageUtils.ts';

test('calculateCollageSlots handles 2-side-by-side preset', () => {
  const slots = calculateCollageSlots(1000, 500, '2-side-by-side', 20);
  assert.equal(slots.length, 2);
  // (1000 - 60) / 2 = 470
  assert.equal(slots[0].width, 470);
  assert.equal(slots[0].height, 460);
  assert.equal(slots[0].x, 20);
  assert.equal(slots[1].x, 510);
});

test('calculateCollageSlots handles 4-grid preset', () => {
  const slots = calculateCollageSlots(1000, 1000, '4-grid', 10);
  assert.equal(slots.length, 4);
  // (1000 - 30) / 2 = 485
  assert.equal(slots[0].width, 485);
  assert.equal(slots[0].height, 485);
  assert.equal(slots[3].x, 505);
  assert.equal(slots[3].y, 505);
});

test('calculateCoverCrop scales and centers landscape image in portrait slot', () => {
  // Image is 1920x1080 (16:9), Slot is 400x400 (1:1)
  const crop = calculateCoverCrop(1920, 1080, 400, 400);
  assert.equal(crop.sHeight, 1080);
  assert.equal(crop.sWidth, 1080);
  assert.equal(crop.sx, (1920 - 1080) / 2); // 420
  assert.equal(crop.sy, 0);
});

test('COLLAGE_ASPECT_RATIOS contains popular social formats', () => {
  assert.ok(COLLAGE_ASPECT_RATIOS['1:1']);
  assert.ok(COLLAGE_ASPECT_RATIOS['4:5']);
  assert.ok(COLLAGE_ASPECT_RATIOS['16:9']);
  assert.ok(COLLAGE_ASPECT_RATIOS['9:16']);
});
