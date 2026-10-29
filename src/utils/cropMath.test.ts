import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRect,
  clampCrop,
  resizeCrop,
  isPointInCrop,
  sanitizeFilename,
  generateUniqueFilenames,
} from './cropMath';
import { calculateGridCrops } from './gridGenerator';
import { isNearWhite } from './colorProcessing';
import { CropRect, GridConfig } from '../types/crop';

test('normalizeRect handles reversed drag coordinates correctly', () => {
  const rect = normalizeRect(150, 200, 50, 80);
  assert.equal(rect.x, 50);
  assert.equal(rect.y, 80);
  assert.equal(rect.width, 100);
  assert.equal(rect.height, 120);
});

test('clampCrop keeps rectangle strictly inside image bounds', () => {
  const clamped = clampCrop({ x: -20, y: 900, width: 300, height: 200 }, 1000, 1000, 10);
  assert.equal(clamped.x, 0);
  assert.equal(clamped.y, 800);
  assert.equal(clamped.width, 300);
  assert.equal(clamped.height, 200);
});

test('clampCrop enforces minimum size', () => {
  const clamped = clampCrop({ x: 10, y: 10, width: 2, height: 1 }, 500, 500, 8);
  assert.equal(clamped.width, 8);
  assert.equal(clamped.height, 8);
});

test('resizeCrop correctly resizes with corner handles', () => {
  const initial = { x: 50, y: 50, width: 100, height: 100 };
  // Drag se handle by +20, +30
  const seResized = resizeCrop(initial, 'se', 20, 30, 500, 500, 10);
  assert.equal(seResized.x, 50);
  assert.equal(seResized.y, 50);
  assert.equal(seResized.width, 120);
  assert.equal(seResized.height, 130);

  // Drag nw handle by +10, +15
  const nwResized = resizeCrop(initial, 'nw', 10, 15, 500, 500, 10);
  assert.equal(nwResized.x, 60);
  assert.equal(nwResized.y, 65);
  assert.equal(nwResized.width, 90);
  assert.equal(nwResized.height, 85);
});

test('isPointInCrop checks bounds correctly', () => {
  const crop: CropRect = { id: '1', name: 'test', x: 100, y: 100, width: 50, height: 50 };
  assert.equal(isPointInCrop(120, 120, crop), true);
  assert.equal(isPointInCrop(99, 120, crop), false);
  assert.equal(isPointInCrop(151, 120, crop), false);
});

test('sanitizeFilename removes bad characters and trims', () => {
  assert.equal(sanitizeFilename('  My-Sprite #01! '), 'My-Sprite__01_');
  assert.equal(sanitizeFilename('   ', 3), '3');
});

test('generateUniqueFilenames generates simple numbers like 1.png, 2.png', () => {
  const crops: CropRect[] = [
    { id: 'c1', name: '1', x: 0, y: 0, width: 50, height: 50 },
    { id: 'c2', name: '2', x: 50, y: 0, width: 50, height: 50 },
    { id: 'c3', name: '', x: 100, y: 0, width: 50, height: 50 },
  ];
  const map = generateUniqueFilenames(crops);
  assert.equal(map.get('c1'), '1.png');
  assert.equal(map.get('c2'), '2.png');
  assert.equal(map.get('c3'), '3.png');
});

test('generateUniqueFilenames avoids duplicates with suffixes', () => {
  const crops: CropRect[] = [
    { id: 'c1', name: 'hero', x: 0, y: 0, width: 50, height: 50 },
    { id: 'c2', name: 'hero', x: 50, y: 0, width: 50, height: 50 },
    { id: 'c3', name: 'hero', x: 100, y: 0, width: 50, height: 50 },
    { id: 'c4', name: 'enemy.png', x: 150, y: 0, width: 50, height: 50 },
  ];
  const map = generateUniqueFilenames(crops);
  assert.equal(map.get('c1'), 'hero.png');
  assert.equal(map.get('c2'), 'hero_1.png');
  assert.equal(map.get('c3'), 'hero_2.png');
  assert.equal(map.get('c4'), 'enemy.png');
});

test('calculateGridCrops computes uniform grid correctly', () => {
  const config: GridConfig = {
    rows: 2,
    cols: 3,
    autoCalculate: true,
    cellWidth: 0,
    cellHeight: 0,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
    gapX: 5,
    gapY: 5,
  };
  // Image is 320 x 215. Available W: 320 - 20 - 2*5 = 290. cellW = floor(290/3) = 96
  // Available H: 215 - 20 - 1*5 = 190. cellH = floor(190/2) = 95
  const crops = calculateGridCrops(config, 320, 215, 0);
  assert.equal(crops.length, 6);
  assert.equal(crops[0].x, 10);
  assert.equal(crops[0].y, 10);
  assert.equal(crops[0].width, 96);
  assert.equal(crops[0].name, '1');
  assert.equal(crops[1].name, '2');
  assert.equal(crops[5].name, '6');
});

test('isNearWhite detects white and near-white colors', () => {
  assert.equal(isNearWhite(255, 255, 255, 10), true);
  assert.equal(isNearWhite(250, 250, 250, 10), true);
  assert.equal(isNearWhite(0, 0, 0, 10), false);
  assert.equal(isNearWhite(200, 50, 50, 15), false);
});
