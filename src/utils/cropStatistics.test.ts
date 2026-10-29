import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCropStatistics,
  calculateExactUnionArea,
  formatArea,
} from './cropStatistics';
import { CropRect, ImageInfo } from '../types/crop';

const mockImage: ImageInfo = {
  name: 'test.png',
  width: 1000,
  height: 500, // Total Area: 500,000 px²
  size: 1024,
  type: 'image/png',
  url: 'blob:test',
};

test('calculateCropStatistics returns 0 metrics when no crops', () => {
  const stats = calculateCropStatistics([], mockImage);
  assert.equal(stats.totalCrops, 0);
  assert.equal(stats.averageArea, 0);
  assert.equal(stats.coveragePercentage, 0);
  assert.equal(stats.imageArea, 500000);
});

test('calculateCropStatistics calculates total crops, average area, and coverage accurately', () => {
  // 2 crops, each 200x250 (area = 50,000 each, total = 100,000)
  // Non-overlapping: crop1 at (0,0), crop2 at (200, 0)
  const crops: CropRect[] = [
    { id: 'c1', name: 'crop1', x: 0, y: 0, width: 200, height: 250 },
    { id: 'c2', name: 'crop2', x: 200, y: 0, width: 200, height: 250 },
  ];

  const stats = calculateCropStatistics(crops, mockImage);

  assert.equal(stats.totalCrops, 2);
  assert.equal(stats.averageArea, 50000); // 100,000 / 2
  assert.equal(stats.totalCropArea, 100000);
  // Coverage: 100,000 / 500,000 = 20%
  assert.equal(stats.coveragePercentage, 20);
  assert.equal(stats.hasOverlap, false);
});

test('calculateExactUnionArea prevents double counting on overlapping crops', () => {
  // crop1: [0, 100] x [0, 100], area = 10,000
  // crop2: [50, 150] x [0, 100], area = 10,000
  // Overlap: [50, 100] x [0, 100], area = 5,000
  // Union should be: 15,000
  const crops: CropRect[] = [
    { id: '1', name: '1', x: 0, y: 0, width: 100, height: 100 },
    { id: '2', name: '2', x: 50, y: 0, width: 100, height: 100 },
  ];

  const union = calculateExactUnionArea(crops, 1000, 1000);
  assert.equal(union, 15000);

  const stats = calculateCropStatistics(crops, { ...mockImage, width: 1000, height: 1000 });
  assert.equal(stats.totalCrops, 2);
  assert.equal(stats.totalCropArea, 20000);
  assert.equal(stats.averageArea, 10000);
  assert.equal(stats.coveragePercentage, 1.5); // 15,000 / 1,000,000 = 1.5%
  assert.equal(stats.hasOverlap, true);
  assert.equal(stats.overlapArea, 5000);
});

test('calculateCropStatistics identifies min and max area crops and aspect ratios', () => {
  const crops: CropRect[] = [
    { id: 'small', name: 'Small Square', x: 0, y: 0, width: 50, height: 50 }, // Area: 2500, square
    { id: 'medium', name: 'Medium Landscape', x: 100, y: 0, width: 200, height: 100 }, // Area: 20000, landscape
    { id: 'tall', name: 'Tall Portrait', x: 400, y: 0, width: 60, height: 180 }, // Area: 10800, portrait
  ];

  const stats = calculateCropStatistics(crops, mockImage);
  assert.equal(stats.minAreaCrop?.crop.id, 'small');
  assert.equal(stats.minAreaCrop?.area, 2500);
  assert.equal(stats.maxAreaCrop?.crop.id, 'medium');
  assert.equal(stats.maxAreaCrop?.area, 20000);
  assert.equal(stats.aspectRatioCounts.square, 1);
  assert.equal(stats.aspectRatioCounts.landscape, 1);
  assert.equal(stats.aspectRatioCounts.portrait, 1);
});

test('calculateCropStatistics provides selected crops breakdown', () => {
  const crops: CropRect[] = [
    { id: '1', name: '1', x: 0, y: 0, width: 100, height: 100 },
    { id: '2', name: '2', x: 200, y: 0, width: 100, height: 100 },
    { id: '3', name: '3', x: 400, y: 0, width: 100, height: 100 },
  ];

  const selectedSet = new Set(['1', '3']);
  const stats = calculateCropStatistics(crops, mockImage, selectedSet);

  assert.equal(stats.selectedCount, 2);
  assert.equal(stats.selectedTotalArea, 20000);
  assert.equal(stats.selectedAverageArea, 10000);
});

test('formatArea formats numbers with commas', () => {
  assert.equal(formatArea(12500), '12,500');
  assert.equal(formatArea(1000000), '1,000,000');
});
