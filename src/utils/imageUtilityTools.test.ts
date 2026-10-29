import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  rgbToHex,
  hexToRgb,
  rgbToHsl,
  hslToRgb,
  calculateAverageColorFromData,
  calculateColorHarmonies,
  generateSvgBlobPath,
  generateSvgPattern,
  formatPhotoDateStamp,
  calculateAspectRatioFit,
  clampCropBox,
  formatBase64Snippets,
  wrapCaptionLines,
  convertSvgStrokesToFills
} from './imageUtilityTools.ts';

describe('Image, SVG, Color & Photo Utility Tools Unit Tests', () => {
  it('rgbToHex and hexToRgb convert back and forth correctly', () => {
    assert.equal(rgbToHex(255, 99, 71), '#FF6347');
    assert.equal(rgbToHex(0, 0, 0), '#000000');
    assert.equal(rgbToHex(255, 255, 255), '#FFFFFF');

    const rgb = hexToRgb('#FF6347');
    assert.deepEqual(rgb, { r: 255, g: 99, b: 71 });

    const shortRgb = hexToRgb('#fff');
    assert.deepEqual(shortRgb, { r: 255, g: 255, b: 255 });
  });

  it('rgbToHsl and hslToRgb calculate correct color representations', () => {
    const hslRed = rgbToHsl(255, 0, 0);
    assert.equal(hslRed.h, 0);
    assert.equal(hslRed.s, 100);
    assert.equal(hslRed.l, 50);

    const backRgb = hslToRgb(hslRed.h, hslRed.s, hslRed.l);
    assert.equal(backRgb.r, 255);
    assert.equal(backRgb.g, 0);
    assert.equal(backRgb.b, 0);
  });

  it('calculateAverageColorFromData computes mean color and darkness', () => {
    // Pure blue 2x2 image
    const bluePixels = [
      0, 0, 255, 255,
      0, 0, 255, 255,
      0, 0, 255, 255,
      0, 0, 255, 255
    ];
    const avg = calculateAverageColorFromData(bluePixels);
    assert.equal(avg.hex, '#0000FF');
    assert.equal(avg.isDark, true); // Perceived luminance of blue is low
  });

  it('calculateColorHarmonies generates complementary and triadic colors', () => {
    const harmonies = calculateColorHarmonies('#FF0000');
    assert.ok(harmonies.complementary.length === 7);
    assert.equal(harmonies.analogous.length, 2);
    assert.equal(harmonies.triadic.length, 2);
    assert.equal(harmonies.shades.length, 4);
  });

  it('generateSvgBlobPath creates valid closed SVG path', () => {
    const blobPath = generateSvgBlobPath(6, 0.4, 400, 123);
    assert.ok(blobPath.startsWith('M '));
    assert.ok(blobPath.endsWith(' Z'));
    assert.ok(blobPath.includes(' C '));
  });

  it('generateSvgPattern produces valid pattern SVG and CSS background data URI', () => {
    const pattern = generateSvgPattern('dots', 40, 8, 2, '#3b82f6', '#ffffff');
    assert.ok(pattern.svg.includes('<circle'));
    assert.ok(pattern.dataUri.startsWith('data:image/svg+xml'));
    assert.ok(pattern.css.includes('background-image'));
  });

  it('formatPhotoDateStamp handles short-y-m-d, yyyy-mm-dd, and y2k formats', () => {
    const d = new Date(1998, 9, 28, 14, 30); // 28 Oct 1998
    const formattedShort = formatPhotoDateStamp(d, 'short-y-m-d');
    assert.equal(formattedShort, "'98 10 28");

    const formattedIso = formatPhotoDateStamp(d, 'yyyy-mm-dd');
    assert.equal(formattedIso, '1998-10-28');

    const formattedY2K = formatPhotoDateStamp(d, 'y2k');
    assert.equal(formattedY2K, "'01 12 31");
  });

  it('calculateAspectRatioFit handles fit, cover, and stretch scaling modes', () => {
    // 2000x1000 image into 1000x1000 box
    const fit = calculateAspectRatioFit(2000, 1000, 1000, 1000, 'fit');
    assert.equal(fit.dw, 1000);
    assert.equal(fit.dh, 500);
    assert.equal(fit.dy, 250); // Letterboxed in center

    const cover = calculateAspectRatioFit(2000, 1000, 1000, 1000, 'cover');
    assert.equal(cover.dw, 1000);
    assert.equal(cover.dh, 1000);
    assert.equal(cover.sw, 1000); // Cropped 1000px width from center
  });

  it('clampCropBox ensures crop remains inside image bounds', () => {
    const clamped = clampCropBox({ x: -50, y: 1500, w: 400, h: 400 }, 1000, 1000, 20);
    assert.equal(clamped.x, 0);
    assert.equal(clamped.y, 600);
    assert.equal(clamped.w, 400);
    assert.equal(clamped.h, 400);
  });

  it('formatBase64Snippets generates clean HTML and CSS snippets with size metrics', () => {
    const testDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const snippets = formatBase64Snippets(testDataUri, 'image/png');
    assert.ok(snippets.imgTag.startsWith('<img src="data:image/png;base64,'));
    assert.ok(snippets.cssBg.startsWith('background-image: url("data:image/png;base64,'));
    assert.ok(snippets.base64Chars > 50);
  });

  it('wrapCaptionLines splits string cleanly by word boundaries', () => {
    const text = 'One does not simply walk into Mordor and expect smooth sailing';
    const lines = wrapCaptionLines(text, 20);
    assert.ok(lines.length >= 3);
    for (const line of lines) {
      assert.ok(line.length <= 25);
    }
  });

  it('convertSvgStrokesToFills replaces stroke attributes with fill', () => {
    const svg = '<svg><circle cx="50" cy="50" r="40" stroke="#FF0000" stroke-width="4" /></svg>';
    const converted = convertSvgStrokesToFills(svg);
    assert.equal(converted.strokeCount, 1);
    assert.ok(converted.convertedSvg.includes('fill="#FF0000"'));
    assert.ok(!converted.convertedSvg.includes('stroke="#FF0000"'));
  });
});
