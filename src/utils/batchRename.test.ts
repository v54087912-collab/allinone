import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_BATCH_RENAME_CONFIG,
  formatPaddedNumber,
  applyCaseTransform,
  sortCropsForBatchRename,
  generateBatchNames,
  BatchRenameConfig,
} from './batchRename';
import { CropRect } from '../types/crop';

const mockCrops: CropRect[] = [
  { id: '1', name: 'old_b', x: 100, y: 10, width: 32, height: 32 },
  { id: '2', name: 'old_a', x: 10, y: 10, width: 32, height: 32 },
  { id: '3', name: 'old_c', x: 50, y: 50, width: 32, height: 32 },
];

test('formatPaddedNumber pads correctly', () => {
  assert.equal(formatPaddedNumber(5, 0), '5');
  assert.equal(formatPaddedNumber(5, 1), '5');
  assert.equal(formatPaddedNumber(5, 2), '05');
  assert.equal(formatPaddedNumber(5, 3), '005');
  assert.equal(formatPaddedNumber(125, 2), '125');
});

test('applyCaseTransform transforms strings properly', () => {
  assert.equal(applyCaseTransform('Hero_Walk_01', 'lowercase'), 'hero_walk_01');
  assert.equal(applyCaseTransform('hero_walk_01', 'uppercase'), 'HERO_WALK_01');
  assert.equal(applyCaseTransform('hero walk 01', 'snake'), 'hero_walk_01');
  assert.equal(applyCaseTransform('hero_walk_01', 'kebab'), 'hero-walk-01');
  assert.equal(applyCaseTransform('HeroWalk', 'none'), 'HeroWalk');
});

test('sortCropsForBatchRename handles spatial and gallery sorting', () => {
  // Spatial row: y=10 first (x=10 before x=100), then y=50
  const rowSorted = sortCropsForBatchRename(mockCrops, 'spatial-row');
  assert.equal(rowSorted[0].id, '2'); // (10, 10)
  assert.equal(rowSorted[1].id, '1'); // (100, 10)
  assert.equal(rowSorted[2].id, '3'); // (50, 50)

  // Name asc: old_a, old_b, old_c
  const nameSorted = sortCropsForBatchRename(mockCrops, 'name-asc');
  assert.equal(nameSorted[0].id, '2');
  assert.equal(nameSorted[1].id, '1');
  assert.equal(nameSorted[2].id, '3');
});

test('generateBatchNames with prefix-sequence pattern', () => {
  const config: BatchRenameConfig = {
    ...DEFAULT_BATCH_RENAME_CONFIG,
    mode: 'prefix-sequence',
    prefix: 'coin',
    separator: '_',
    startIndex: 1,
    step: 1,
    padDigits: 2,
    sortOrder: 'spatial-row',
  };

  const results = generateBatchNames(mockCrops, config);
  assert.equal(results.length, 3);
  assert.equal(results[0].newName, 'coin_01');
  assert.equal(results[1].newName, 'coin_02');
  assert.equal(results[2].newName, 'coin_03');
  assert.equal(results[0].hasConflict, false);
});

test('generateBatchNames with sequence-only pattern', () => {
  const config: BatchRenameConfig = {
    ...DEFAULT_BATCH_RENAME_CONFIG,
    mode: 'sequence-only',
    startIndex: 10,
    step: 5,
    padDigits: 3,
    suffix: 'idle',
    separator: '-',
    sortOrder: 'spatial-row',
  };

  const results = generateBatchNames(mockCrops, config);
  assert.equal(results[0].newName, '010-idle');
  assert.equal(results[1].newName, '015-idle');
  assert.equal(results[2].newName, '020-idle');
});

test('generateBatchNames with custom template', () => {
  const config: BatchRenameConfig = {
    ...DEFAULT_BATCH_RENAME_CONFIG,
    mode: 'custom-template',
    prefix: 'icon',
    template: '{prefix}_{index}_{w}x{h}',
    startIndex: 1,
    step: 1,
    padDigits: 2,
    sortOrder: 'gallery',
  };

  const results = generateBatchNames(mockCrops, config);
  assert.equal(results[0].newName, 'icon_01_32x32');
  assert.equal(results[1].newName, 'icon_02_32x32');
  assert.equal(results[2].newName, 'icon_03_32x32');
});

test('generateBatchNames with find and replace', () => {
  const config: BatchRenameConfig = {
    ...DEFAULT_BATCH_RENAME_CONFIG,
    mode: 'find-replace',
    findText: 'old',
    replaceText: 'item',
    sortOrder: 'gallery',
  };

  const results = generateBatchNames(mockCrops, config);
  assert.equal(results[0].newName, 'item_b');
  assert.equal(results[1].newName, 'item_a');
  assert.equal(results[2].newName, 'item_c');
});

test('generateBatchNames flags conflicts correctly', () => {
  const cropsWithSameName: CropRect[] = [
    { id: '1', name: 'icon_test', x: 0, y: 0, width: 32, height: 32 },
    { id: '2', name: 'icon_other', x: 10, y: 0, width: 32, height: 32 },
  ];

  const config: BatchRenameConfig = {
    ...DEFAULT_BATCH_RENAME_CONFIG,
    mode: 'find-replace',
    findText: 'other',
    replaceText: 'test',
    sortOrder: 'gallery',
  };

  const results = generateBatchNames(cropsWithSameName, config);
  assert.equal(results[0].newName, 'icon_test');
  assert.equal(results[1].newName, 'icon_test');
  assert.equal(results[0].hasConflict, true);
  assert.equal(results[1].hasConflict, true);
});
