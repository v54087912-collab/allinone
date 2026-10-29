import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDmsToDecimal,
  formatExposureTime,
  parseExifFromArrayBuffer,
} from './metadataUtils';

test('formatDmsToDecimal converts degrees, minutes, seconds to decimal latitude/longitude', () => {
  // New York City: 40° 42' 46" N -> ~40.712778
  const lat = formatDmsToDecimal(40, 42, 46, 'N');
  assert.equal(lat, 40.712778);

  // 74° 0' 21" W -> -74.005833
  const lon = formatDmsToDecimal(74, 0, 21, 'W');
  assert.equal(lon, -74.005833);

  // South latitude should be negative
  const southLat = formatDmsToDecimal(33, 51, 35, 'S');
  assert.equal(southLat, -33.859722);
});

test('formatExposureTime formats shutter speeds cleanly', () => {
  assert.equal(formatExposureTime(0.004), '1/250s');
  assert.equal(formatExposureTime(0.001), '1/1000s');
  assert.equal(formatExposureTime(2.5), '2.5s');
  assert.equal(formatExposureTime(1.0), '1.0s');
  assert.equal(formatExposureTime(0), '0s');
});

test('parseExifFromArrayBuffer returns null for non-JPEG buffers', () => {
  const fakePng = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).buffer;
  assert.equal(parseExifFromArrayBuffer(fakePng), null);

  const empty = new ArrayBuffer(0);
  assert.equal(parseExifFromArrayBuffer(empty), null);
});
