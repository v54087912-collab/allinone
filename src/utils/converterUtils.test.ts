import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatToExtension,
  extensionToMime,
  generateConvertedFilename,
  SUPPORTED_TARGET_FORMATS,
} from './converterUtils';

test('formatToExtension maps MIME types correctly', () => {
  assert.equal(formatToExtension('image/jpeg'), 'jpg');
  assert.equal(formatToExtension('image/jpg'), 'jpg');
  assert.equal(formatToExtension('image/webp'), 'webp');
  assert.equal(formatToExtension('image/png'), 'png');
  assert.equal(formatToExtension('image/bmp'), 'bmp');
  assert.equal(formatToExtension('unknown/type'), 'png');
});

test('extensionToMime maps file extensions correctly', () => {
  assert.equal(extensionToMime('jpg'), 'image/jpeg');
  assert.equal(extensionToMime('.jpeg'), 'image/jpeg');
  assert.equal(extensionToMime('webp'), 'image/webp');
  assert.equal(extensionToMime('.png'), 'image/png');
  assert.equal(extensionToMime('bmp'), 'image/bmp');
});

test('generateConvertedFilename replaces extension properly', () => {
  assert.equal(generateConvertedFilename('photo.png', 'image/jpeg'), 'photo.jpg');
  assert.equal(generateConvertedFilename('my-artwork.jpeg', 'image/webp'), 'my-artwork.webp');
  assert.equal(generateConvertedFilename('nested.file.name.bmp', 'image/png'), 'nested.file.name.png');
  assert.equal(generateConvertedFilename('no-ext', 'image/webp'), 'no-ext.webp');
});

test('SUPPORTED_TARGET_FORMATS contains required formats', () => {
  const mimes = SUPPORTED_TARGET_FORMATS.map((f) => f.mime);
  assert.ok(mimes.includes('image/png'));
  assert.ok(mimes.includes('image/jpeg'));
  assert.ok(mimes.includes('image/webp'));
  assert.ok(mimes.includes('image/bmp'));
});
