import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hslToRgb,
  generateHarmonicPalette,
  getRelativeLuminance,
  calculateContrastRatio,
  formatBoxShadowCss,
  formatBorderRadiusCss,
  generateSvgWave,
  generateSvgBlob,
  SOCIAL_MEDIA_PRESETS,
  convertPixelsToAscii,
  ASCII_CHAR_SETS,
} from './designUtils.ts';

test('hslToRgb converts primary and secondary hues correctly', () => {
  const red = hslToRgb(0, 100, 50);
  assert.equal(red.r, 255);
  assert.equal(red.g, 0);
  assert.equal(red.b, 0);

  const green = hslToRgb(120, 100, 50);
  assert.equal(green.r, 0);
  assert.equal(green.g, 255);
  assert.equal(green.b, 0);

  const blue = hslToRgb(240, 100, 50);
  assert.equal(blue.r, 0);
  assert.equal(blue.g, 0);
  assert.equal(blue.b, 255);
});

test('generateHarmonicPalette generates 5 valid hex colors', () => {
  const comp = generateHarmonicPalette('#3b82f6', 'complementary');
  assert.equal(comp.length, 5);
  comp.forEach((c) => assert.match(c, /^#[0-9a-fA-F]{6}$/));

  const anal = generateHarmonicPalette('#ff0055', 'analogous');
  assert.equal(anal.length, 5);

  const tri = generateHarmonicPalette('#10b981', 'triadic');
  assert.equal(tri.length, 5);

  const mono = generateHarmonicPalette('#8b5cf6', 'monochromatic');
  assert.equal(mono.length, 5);
});

test('calculateContrastRatio computes WCAG 2.1 compliance accurately', () => {
  // Black and White is maximum 21:1
  const bw = calculateContrastRatio('#ffffff', '#000000');
  assert.equal(bw.ratio, 21);
  assert.equal(bw.aaNormal, true);
  assert.equal(bw.aaaNormal, true);
  assert.equal(bw.score, 'Excellent');

  // Low contrast: gray on white
  const low = calculateContrastRatio('#ffffff', '#cccccc');
  assert.ok(low.ratio < 3.0);
  assert.equal(low.aaNormal, false);
  assert.equal(low.score, 'Poor');

  // High contrast blue on white
  const blue = calculateContrastRatio('#ffffff', '#003366');
  assert.ok(blue.ratio >= 7.0);
  assert.equal(blue.aaaNormal, true);
});

test('formatBoxShadowCss formats multi-layer and inset shadows', () => {
  const shadow = formatBoxShadowCss([
    { x: 0, y: 4, blur: 6, spread: -1, color: 'rgba(0,0,0,0.1)', inset: false },
    { x: 0, y: 2, blur: 4, spread: -2, color: 'rgba(0,0,0,0.05)', inset: false },
  ]);
  assert.equal(
    shadow,
    '0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.05)'
  );

  const inset = formatBoxShadowCss([
    { x: 2, y: 2, blur: 5, spread: 0, color: '#000', inset: true },
  ]);
  assert.equal(inset, 'inset 2px 2px 5px 0px #000');
});

test('formatBorderRadiusCss formats 4-corner and 8-point values', () => {
  assert.equal(formatBorderRadiusCss(8, 8, 8, 8), '8px 8px 8px 8px');
  assert.equal(
    formatBorderRadiusCss(60, 40, 30, 70, 60, 30, 70, 40),
    '60% 40% 30% 70% / 60% 30% 70% 40%'
  );
});

test('generateSvgWave and generateSvgBlob output valid SVG markup', () => {
  const wave = generateSvgWave(1200, 300, 4, 80, '#2563eb');
  assert.ok(wave.svgCode.includes('<svg'));
  assert.ok(wave.svgCode.includes('<path d="M 0'));
  assert.ok(wave.path.startsWith('M 0'));

  const blob = generateSvgBlob(400, 6, 0.25, '#7c3aed');
  assert.ok(blob.svgCode.includes('<svg'));
  assert.ok(blob.svgCode.includes('Z"'));
});

test('SOCIAL_MEDIA_PRESETS contains major network formats', () => {
  assert.ok(SOCIAL_MEDIA_PRESETS.length >= 10);
  const igSquare = SOCIAL_MEDIA_PRESETS.find((p) => p.name.includes('Square Post'));
  assert.ok(igSquare);
  assert.equal(igSquare.width, 1080);
  assert.equal(igSquare.height, 1080);

  const ytThumb = SOCIAL_MEDIA_PRESETS.find((p) => p.name.includes('Thumbnail'));
  assert.ok(ytThumb);
  assert.equal(ytThumb.width, 1280);
  assert.equal(ytThumb.height, 720);
});

test('convertPixelsToAscii transforms pixels into text art', () => {
  // 4x4 image: top half white (255), bottom half black (0)
  const pixels = new Uint8ClampedArray(4 * 4 * 4);
  for (let i = 0; i < 4 * 4; i++) {
    const isTop = i < 8;
    const val = isTop ? 255 : 0;
    pixels[i * 4] = val;
    pixels[i * 4 + 1] = val;
    pixels[i * 4 + 2] = val;
    pixels[i * 4 + 3] = 255;
  }

  const ascii = convertPixelsToAscii(pixels, 4, 4, 4, ASCII_CHAR_SETS.simple, false);
  assert.ok(ascii.length > 0);
  const lines = ascii.split('\n');
  assert.ok(lines.length >= 2);
});
