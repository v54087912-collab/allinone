import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  optimizeSvgString,
  generateGlassmorphismStyles,
  generatePlaceholderSvg
} from './vectorDesignUtils.ts';

describe('Vector & Design Utilities Unit Tests', () => {
  it('optimizeSvgString strips editor namespaces, comments and rounds numbers', () => {
    const rawSvg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Created with Inkscape (http://www.inkscape.org/) -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="100" height="100">
  <metadata>
    <rdf:RDF>Test</rdf:RDF>
  </metadata>
  <path d="M 10.12345 20.67891 L 30.00000 40.00000" />
</svg>`;

    const res = optimizeSvgString(rawSvg);
    assert.ok(!res.optimizedSvg.includes('<?xml'));
    assert.ok(!res.optimizedSvg.includes('Inkscape'));
    assert.ok(!res.optimizedSvg.includes('<metadata>'));
    assert.ok(res.optimizedSvg.includes('10.12'));
    assert.ok(res.savingsPercent > 20);
  });

  it('generateGlassmorphismStyles produces valid CSS and Tailwind classes', () => {
    const res = generateGlassmorphismStyles({
      blurPx: 12,
      bgOpacity: 0.25,
      bgColorHex: '#ffffff',
      borderOpacity: 0.18,
      shadowIntensity: 0.5
    });

    assert.ok(res.css.includes('backdrop-filter: blur(12px)'));
    assert.ok(res.css.includes('rgba(255, 255, 255, 0.25)'));
    assert.ok(res.tailwind.includes('backdrop-blur-[12px]'));
  });

  it('generatePlaceholderSvg creates valid SVG with dimensions and label', () => {
    const svg = generatePlaceholderSvg(600, 400, 'Custom Banner', '#0f172a', '#38bdf8');
    assert.ok(svg.includes('width="600"'));
    assert.ok(svg.includes('height="400"'));
    assert.ok(svg.includes('Custom Banner'));
    assert.ok(svg.includes('#0f172a'));
    assert.ok(svg.includes('#38bdf8'));
  });
});
