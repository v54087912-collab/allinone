import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rgbToHex,
  hexToRgb,
  rgbToHsl,
  rgbToCmyk,
  getContrastColor,
  getColorDetails,
  extractDominantColorsFromPixels,
} from './colorPickerUtils';

test('rgbToHex converts RGB values properly', () => {
  assert.equal(rgbToHex(255, 255, 255), '#ffffff');
  assert.equal(rgbToHex(0, 0, 0), '#000000');
  assert.equal(rgbToHex(255, 0, 0), '#ff0000');
  assert.equal(rgbToHex(0, 255, 0), '#00ff00');
  assert.equal(rgbToHex(59, 130, 246), '#3b82f6');
});

test('hexToRgb parses hex colors correctly', () => {
  assert.deepEqual(hexToRgb('#ffffff'), { r: 255, g: 255, b: 255 });
  assert.deepEqual(hexToRgb('000000'), { r: 0, g: 0, b: 0 });
  assert.deepEqual(hexToRgb('#fff'), { r: 255, g: 255, b: 255 });
  assert.deepEqual(hexToRgb('#f00'), { r: 255, g: 0, b: 0 });
  assert.equal(hexToRgb('invalid'), null);
});

test('rgbToHsl converts RGB to HSL correctly', () => {
  const pureRed = rgbToHsl(255, 0, 0);
  assert.equal(pureRed.h, 0);
  assert.equal(pureRed.s, 100);
  assert.equal(pureRed.l, 50);

  const white = rgbToHsl(255, 255, 255);
  assert.equal(white.l, 100);

  const black = rgbToHsl(0, 0, 0);
  assert.equal(black.l, 0);
});

test('rgbToCmyk converts RGB to CMYK correctly', () => {
  const black = rgbToCmyk(0, 0, 0);
  assert.equal(black.k, 100);

  const pureRed = rgbToCmyk(255, 0, 0);
  assert.equal(pureRed.c, 0);
  assert.equal(pureRed.m, 100);
  assert.equal(pureRed.y, 100);
  assert.equal(pureRed.k, 0);
});

test('getContrastColor returns black for light and white for dark', () => {
  assert.equal(getContrastColor(255, 255, 255), '#000000');
  assert.equal(getContrastColor(240, 240, 240), '#000000');
  assert.equal(getContrastColor(0, 0, 0), '#ffffff');
  assert.equal(getContrastColor(30, 30, 40), '#ffffff');
});

test('getColorDetails returns full formatted object', () => {
  const details = getColorDetails(59, 130, 246);
  assert.equal(details.hex, '#3b82f6');
  assert.equal(details.rgb, 'rgb(59, 130, 246)');
  assert.ok(details.hsl.startsWith('hsl('));
  assert.ok(details.cmyk.startsWith('cmyk('));
});

test('extractDominantColorsFromPixels identifies dominant color in pixel array', () => {
  // Create a 10x10 red canvas with a couple blue pixels
  const pixels = new Uint8ClampedArray(10 * 10 * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    if (i < 80) {
      // First 20 pixels blue
      pixels[i] = 0;
      pixels[i + 1] = 0;
      pixels[i + 2] = 255;
      pixels[i + 3] = 255;
    } else {
      // 80 pixels red
      pixels[i] = 255;
      pixels[i + 1] = 0;
      pixels[i + 2] = 0;
      pixels[i + 3] = 255;
    }
  }

  const dominant = extractDominantColorsFromPixels(pixels, 4);
  assert.ok(dominant.length >= 1);
  assert.equal(dominant[0].hex, '#ff0000');
});
