import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectBackgroundColor,
  getColorDistance,
  mergeCloseBoxes,
  detectObjectsFromPixels,
  convertDetectedBoxesToCrops,
  DetectedBox,
} from './objectDetection';

test('detectBackgroundColor correctly identifies white and black backgrounds', () => {
  // 10x10 white buffer (all [255, 255, 255, 255])
  const whiteData = new Uint8Array(10 * 10 * 4);
  whiteData.fill(255);
  const bgWhite = detectBackgroundColor({ data: whiteData, width: 10, height: 10 });
  assert.equal(bgWhite.r, 255);
  assert.equal(bgWhite.g, 255);
  assert.equal(bgWhite.b, 255);
  assert.equal(bgWhite.isTransparent, false);

  // 10x10 transparent buffer (all [0, 0, 0, 0])
  const transData = new Uint8Array(10 * 10 * 4);
  const bgTrans = detectBackgroundColor({ data: transData, width: 10, height: 10 });
  assert.equal(bgTrans.isTransparent, true);
});

test('getColorDistance computes contrast distance', () => {
  const bg = { r: 255, g: 255, b: 255, isTransparent: false };
  // Pure white against pure white has 0 distance
  assert.equal(getColorDistance(255, 255, 255, 255, bg), 0);
  // Pure black against white has large distance (~255)
  const dist = getColorDistance(0, 0, 0, 255, bg);
  assert.ok(dist > 250);
});

test('mergeCloseBoxes merges boxes within merge distance', () => {
  const boxes: DetectedBox[] = [
    { id: '1', x: 10, y: 10, width: 20, height: 20, pixelCount: 100 },
    { id: '2', x: 32, y: 10, width: 20, height: 20, pixelCount: 100 }, // 2px away from box 1
    { id: '3', x: 100, y: 100, width: 20, height: 20, pixelCount: 100 }, // far away
  ];

  const merged = mergeCloseBoxes(boxes, 5); // 5px merge distance
  assert.equal(merged.length, 2);
  assert.equal(merged[0].x, 10);
  assert.equal(merged[0].width, 42); // from x=10 to x=52
});

test('detectObjectsFromPixels detects 2 distinct high-contrast objects on white canvas', () => {
  const width = 100;
  const height = 100;
  const data = new Uint8Array(width * height * 4);
  data.fill(255); // White background

  // Object 1: black square at (10, 10), 20x20
  for (let y = 10; y < 30; y++) {
    for (let x = 10; x < 30; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = 0;
      data[idx + 1] = 0;
      data[idx + 2] = 0;
    }
  }

  // Object 2: red square at (60, 60), 20x20
  for (let y = 60; y < 80; y++) {
    for (let x = 60; x < 80; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = 220;
      data[idx + 1] = 20;
      data[idx + 2] = 20;
    }
  }

  const detected = detectObjectsFromPixels(
    { data, width, height },
    {
      threshold: 30,
      minWidth: 10,
      minHeight: 10,
      minArea: 50,
      padding: 0,
      mergeDistance: 4,
    }
  );

  assert.equal(detected.length, 2);
  assert.equal(detected[0].x, 10);
  assert.equal(detected[0].y, 10);
  assert.equal(detected[0].width, 20);
  assert.equal(detected[0].height, 20);

  assert.equal(detected[1].x, 60);
  assert.equal(detected[1].y, 60);
  assert.equal(detected[1].width, 20);
  assert.equal(detected[1].height, 20);
});

test('convertDetectedBoxesToCrops produces valid CropRects', () => {
  const boxes: DetectedBox[] = [
    { id: '1', x: 20, y: 30, width: 50, height: 60, pixelCount: 3000 },
  ];

  const crops = convertDetectedBoxesToCrops(boxes, 'sprite', 1);
  assert.equal(crops.length, 1);
  assert.equal(crops[0].name, 'sprite_01');
  assert.equal(crops[0].x, 20);
  assert.equal(crops[0].y, 30);
  assert.equal(crops[0].width, 50);
  assert.equal(crops[0].height, 60);
  assert.equal(crops[0].selected, true);
});
