import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import {
  calculateDocumentStats,
  clampZoom,
  deletePageFromList,
  detectDocumentType,
  duplicatePageInList,
  highlightMatches,
  normalizeRotation,
  parsePageJump,
  reorderPagesList,
} from './pdfDocsUtils.ts';

describe('PDF & Docs Utilities Unit Tests', () => {
  test('detectDocumentType recognizes PDF, Word, and text documents', () => {
    assert.equal(detectDocumentType('report.pdf'), 'pdf');
    assert.equal(detectDocumentType('contract.docx'), 'docx');
    assert.equal(detectDocumentType('notes.txt'), 'txt');
    assert.equal(detectDocumentType('readme.md'), 'md');
    assert.equal(detectDocumentType('data.json'), 'json');
    assert.equal(detectDocumentType('page.html'), 'html');
    assert.equal(detectDocumentType('unknown.xyz'), 'other');

    // MIME type fallback
    assert.equal(detectDocumentType('myfile', 'application/pdf'), 'pdf');
    assert.equal(
      detectDocumentType(
        'file',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ),
      'docx'
    );
  });

  test('calculateDocumentStats calculates words, characters, lines, and reading time', () => {
    const text = 'Hello world!\nThis is a second line of text.\n\nAnd a new paragraph.';
    const stats = calculateDocumentStats(text);

    assert.equal(stats.words, 13);
    assert.ok(stats.chars > 0);
    assert.equal(stats.lines, 4);
    assert.equal(stats.paragraphs, 2);
    assert.equal(stats.readingTimeMin, 1);

    const emptyStats = calculateDocumentStats('');
    assert.equal(emptyStats.words, 0);
    assert.equal(emptyStats.chars, 0);
    assert.equal(emptyStats.readingTimeMin, 0);
  });

  test('highlightMatches safely escapes text and highlights matching queries', () => {
    const text = 'The quick brown fox jumps over the lazy dog. Quick Fox!';
    const { html, matchCount } = highlightMatches(text, 'quick');

    assert.equal(matchCount, 2);
    assert.ok(html.includes('<mark class='));
    assert.ok(html.includes('brown fox jumps'));

    // Check XSS escaping
    const unsafeText = '<script>alert(1)</script> and query';
    const { html: safeHtml } = highlightMatches(unsafeText, 'query');
    assert.ok(!safeHtml.includes('<script>'));
    assert.ok(safeHtml.includes('&lt;script&gt;'));
  });

  test('clampZoom respects min and max limits', () => {
    assert.equal(clampZoom(1.0), 1.0);
    assert.equal(clampZoom(0.1), 0.25);
    assert.equal(clampZoom(4.5), 3.0);
    assert.equal(clampZoom(NaN), 1.0);
  });

  test('normalizeRotation correctly keeps angles within 0-360 range', () => {
    assert.equal(normalizeRotation(0, 90), 90);
    assert.equal(normalizeRotation(270, 90), 0);
    assert.equal(normalizeRotation(0, -90), 270);
    assert.equal(normalizeRotation(180, 180), 0);
  });

  test('parsePageJump safely parses 1-based page input', () => {
    assert.equal(parsePageJump('5', 10), 5);
    assert.equal(parsePageJump('1', 10), 1);
    assert.equal(parsePageJump('10', 10), 10);
    assert.equal(parsePageJump('0', 10), null);
    assert.equal(parsePageJump('11', 10), null);
    assert.equal(parsePageJump('abc', 10), null);
    assert.equal(parsePageJump('2', 0), null);
  });

  test('reorderPagesList reorders pages correctly', () => {
    const pages = [1, 2, 3, 4, 5];
    const reordered = reorderPagesList(pages, 0, 2);
    assert.deepEqual(reordered, [2, 3, 1, 4, 5]);

    // Invalid indices leave array intact
    const unchanged = reorderPagesList(pages, -1, 3);
    assert.deepEqual(unchanged, [1, 2, 3, 4, 5]);
  });

  test('duplicatePageInList and deletePageFromList manage page counts safely', () => {
    const pages = [1, 2, 3];
    const duplicated = duplicatePageInList(pages, 1);
    assert.deepEqual(duplicated, [1, 2, 2, 3]);

    const deleted = deletePageFromList([1, 2, 3], 1);
    assert.deepEqual(deleted, [1, 3]);

    // Does not delete last remaining page
    const single = [1];
    assert.deepEqual(deletePageFromList(single, 0), [1]);
  });
});
