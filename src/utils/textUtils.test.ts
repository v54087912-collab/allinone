import test from 'node:test';
import assert from 'node:assert';
import {
  analyzeText,
  convertCase,
  reverseText,
  computeTextDiff,
  generateLoremIpsum,
  analyzeSentences,
  removeExtraSpaces,
  removeDuplicateLines,
  sortTextLines,
  generateSlug,
  calculateReadability,
  checkGrammarAndStyle,
  summarizeText,
  renderSimpleMarkdown,
} from './textUtils.ts';

test('analyzeText computes words, characters, sentences, and paragraphs accurately', () => {
  const sample = 'Hello world! This is a test sentence.\n\nHere is paragraph two.';
  const stats = analyzeText(sample);

  assert.strictEqual(stats.words, 11);
  assert.strictEqual(stats.paragraphs, 2);
  assert.strictEqual(stats.sentences, 3);
  assert.ok(stats.characters > stats.charactersNoSpaces);
  assert.strictEqual(stats.readingTimeMin, 1);
});

test('analyzeText handles empty text gracefully', () => {
  const stats = analyzeText('');
  assert.strictEqual(stats.words, 0);
  assert.strictEqual(stats.characters, 0);
});

test('convertCase handles all major case formats properly', () => {
  const input = 'hello world test';

  assert.strictEqual(convertCase(input, 'upper'), 'HELLO WORLD TEST');
  assert.strictEqual(convertCase('HELLO WORLD', 'lower'), 'hello world');
  assert.strictEqual(convertCase(input, 'title'), 'Hello World Test');
  assert.strictEqual(convertCase(input, 'camel'), 'helloWorldTest');
  assert.strictEqual(convertCase(input, 'pascal'), 'HelloWorldTest');
  assert.strictEqual(convertCase(input, 'snake'), 'hello_world_test');
  assert.strictEqual(convertCase(input, 'kebab'), 'hello-world-test');
  assert.strictEqual(convertCase(input, 'constant'), 'HELLO_WORLD_TEST');
  assert.strictEqual(convertCase('abc', 'alternating'), 'aBc');
});

test('reverseText reverses characters, words, and creates flip text', () => {
  assert.strictEqual(reverseText('hello', 'chars'), 'olleh');
  assert.strictEqual(reverseText('hello world', 'words'), 'world hello');
  assert.strictEqual(reverseText('hello world', 'each-word'), 'olleh dlrow');
  assert.ok(reverseText('hello', 'flip').length > 0);
});

test('computeTextDiff highlights same, added, and removed lines', () => {
  const oldText = 'Line 1\nLine 2\nLine 3';
  const newText = 'Line 1\nLine 2 modified\nLine 3\nLine 4';

  const diff = computeTextDiff(oldText, newText);
  assert.ok(diff.length >= 3);
  assert.ok(diff.some((d) => d.type === 'same'));
  assert.ok(diff.some((d) => d.type === 'added'));
  assert.ok(diff.some((d) => d.type === 'removed'));
});

test('generateLoremIpsum generates paragraphs, sentences, and words', () => {
  const words = generateLoremIpsum(10, 'words');
  assert.strictEqual(words.split(' ').length, 10);
  assert.ok(words.startsWith('Lorem ipsum'));

  const paras = generateLoremIpsum(2, 'paragraphs');
  assert.strictEqual(paras.split('\n\n').length, 2);
});

test('analyzeSentences counts sentences, averages, and flags long sentences', () => {
  const sample = 'First sentence is short. The second sentence is a little bit longer than the first one! And what about the third sentence?';
  const res = analyzeSentences(sample);
  assert.strictEqual(res.totalSentences, 3);
  assert.ok(res.avgWordsPerSentence > 3);
  assert.strictEqual(res.longSentencesCount, 0);
  assert.strictEqual(res.sentences.length, 3);
});

test('removeExtraSpaces collapses spaces and removes empty lines properly', () => {
  const messy = '   Hello    World!   \n\n\n   This   is   a   test.   \n';
  const clean = removeExtraSpaces(messy, { collapseSpaces: true, removeEmptyLines: true, trimLeadingTrailing: true });
  assert.strictEqual(clean, 'Hello World!\nThis is a test.');
});

test('removeDuplicateLines removes duplicates preserving unique order', () => {
  const lines = 'Apple\nBanana\napple\nBanana\nOrange\nApple';
  const resCaseSens = removeDuplicateLines(lines, { caseSensitive: true });
  assert.strictEqual(resCaseSens.duplicatesRemoved, 2);
  assert.strictEqual(resCaseSens.uniqueLinesCount, 4);

  const resCaseInsens = removeDuplicateLines(lines, { caseSensitive: false });
  assert.strictEqual(resCaseInsens.duplicatesRemoved, 3);
  assert.strictEqual(resCaseInsens.uniqueLinesCount, 3);
});

test('sortTextLines handles A-Z, length, and natural sorting', () => {
  const input = 'Cherry\nApple\nbanana\n10 items\n2 items';
  const az = sortTextLines(input, 'az', false);
  assert.ok(az.startsWith('10 items\n2 items\nApple'));

  const natural = sortTextLines('Item 10\nItem 2\nItem 1', 'natural');
  assert.strictEqual(natural, 'Item 1\nItem 2\nItem 10');

  const len = sortTextLines('Long line\nHi\nMedium line', 'length-asc');
  assert.ok(len.startsWith('Hi\nLong line'));
});

test('generateSlug converts strings to clean SEO URLs', () => {
  assert.strictEqual(
    generateSlug('10 Best Design Tools in 2026!'),
    '10-best-design-tools-in-2026'
  );
  assert.strictEqual(
    generateSlug('Café & Crème Brûlée', { separator: '_' }),
    'cafe_creme_brulee'
  );
});

test('calculateReadability evaluates Flesch reading ease and grade levels', () => {
  const text = 'The cat sat on the mat. The sun was hot.';
  const score = calculateReadability(text);
  assert.ok(score.fleschEase > 80);
  assert.strictEqual(score.sentences, 2);
  assert.ok(score.readingLevel.length > 0);
});

test('checkGrammarAndStyle catches repeated words, typos, and spacing', () => {
  const text = 'This is teh book .It has alot of pages in in it,, right?';
  const issues = checkGrammarAndStyle(text);
  assert.ok(issues.some((i) => i.type === 'repeated-word'));
  assert.ok(issues.some((i) => i.type === 'spelling'));
  assert.ok(issues.some((i) => i.type === 'punctuation'));
  assert.ok(issues.some((i) => i.type === 'spacing'));
});

test('summarizeText produces condensed summaries with keywords', () => {
  const text = `
    Cloud computing provides on-demand data storage and computing power over the internet.
    Instead of buying and maintaining physical servers, organizations can access services from cloud providers.
    Modern businesses rely on the cloud for flexibility, cost reduction, and scalability.
    Cloud security has become a primary priority as cyber threats continue to evolve.
    In conclusion, cloud infrastructure remains essential for global digital transformation.
  `;
  const res = summarizeText(text, 0.4);
  assert.ok(res.summaryWords < res.originalWords);
  assert.ok(res.reductionPercentage > 0);
  assert.ok(res.keySentences.length >= 1);
  assert.ok(res.keywords.length > 0);
});

test('renderSimpleMarkdown formats headings, bold, code, and links', () => {
  const md = '# Title\n**Bold text** with `code` and [link](https://example.com)';
  const html = renderSimpleMarkdown(md);
  assert.ok(html.includes('<h1'));
  assert.ok(html.includes('<strong'));
  assert.ok(html.includes('<code'));
  assert.ok(html.includes('<a href='));
});
