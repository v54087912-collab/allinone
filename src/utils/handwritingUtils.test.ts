import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  convertToBionic,
  cleanWhitespace,
  analyzeLetterCounts,
  HANDWRITING_FONTS,
  PAPER_PRESETS
} from './handwritingUtils.ts';

describe('Handwriting & Typography Utilities Unit Tests', () => {
  it('convertToBionic bolds initial letters of words according to fixation percent', () => {
    const input = 'Reading faster with bionic mode';
    const output = convertToBionic(input, 0.5);
    // 'Reading' (7 chars) -> ceil(7 * 0.5) = 4 chars bolded: <b>Read</b>ing
    assert.ok(output.includes('<b>Read</b>ing'));
    // 'faster' (6 chars) -> ceil(6 * 0.5) = 3 chars bolded: <b>fas</b>ter
    assert.ok(output.includes('<b>fas</b>ter'));
    assert.ok(output.includes('<b>bio</b>nic'));
  });

  it('cleanWhitespace collapses excessive spaces and handles blank lines', () => {
    const dirty = '  Hello    world!  \n\n\n  Second   line.   ';
    const cleaned = cleanWhitespace(dirty, {
      collapseSpaces: true,
      trimLines: true,
      removeBlankLines: true
    });

    assert.equal(cleaned, 'Hello world!\nSecond line.');
  });

  it('analyzeLetterCounts counts letters accurately and evaluates social limits', () => {
    const text = 'QuickPic Studio is 100% free and client-side!';
    const res = analyzeLetterCounts(text);

    assert.ok(res.letters > 25);
    assert.equal(res.digits, 3); // '100'
    assert.equal(res.limits.twitter.isOver, false);
    assert.ok(res.limits.twitter.remaining > 200);
  });

  it('HANDWRITING_FONTS contains all 7 built-in handwriting fonts', () => {
    assert.equal(HANDWRITING_FONTS.length, 7);
    const names = HANDWRITING_FONTS.map(f => f.name);
    assert.ok(names.includes('Antony Lark'));
    assert.ok(names.includes('Kunjar Script'));
    assert.ok(names.includes('Caroline Mutiboko'));
  });

  it('PAPER_PRESETS includes ruled, blank, and legal pads', () => {
    assert.ok(PAPER_PRESETS.length >= 4);
    const ids = PAPER_PRESETS.map(p => p.id);
    assert.ok(ids.includes('ruled'));
    assert.ok(ids.includes('legal'));
  });
});
