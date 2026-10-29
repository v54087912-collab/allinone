import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeXml,
  groupTextItemsIntoParagraphs,
  createDocxZip,
  extractTextFromDocx,
} from './docxUtils.ts';

test('escapeXml escapes XML special characters correctly', () => {
  assert.equal(escapeXml("Hello & <World> \"Quote\" 'Apos'"), 'Hello &amp; &lt;World&gt; &quot;Quote&quot; &apos;Apos&apos;');
});

test('groupTextItemsIntoParagraphs sorts by Y coordinates and groups into lines', () => {
  const items = [
    { str: 'World', x: 80, y: 700, width: 40, height: 12 },
    { str: 'Hello', x: 20, y: 700, width: 40, height: 12 },
    { str: 'Document Title', x: 50, y: 750, width: 120, height: 24 }, // Heading
    { str: 'Second paragraph.', x: 20, y: 650, width: 100, height: 12 },
  ];

  const paras = groupTextItemsIntoParagraphs(items);
  assert.equal(paras.length, 3);
  assert.equal(paras[0].text, 'Document Title');
  assert.equal(paras[0].isHeading, true);
  assert.equal(paras[1].text, 'Hello World');
  assert.equal(paras[1].isHeading, false);
  assert.equal(paras[2].text, 'Second paragraph.');
});

test('createDocxZip generates valid OpenXML ZIP that can be parsed back', async () => {
  const pages = [
    {
      pageNumber: 1,
      paragraphs: [
        { text: 'Quarterly Financial Report', isHeading: true },
        { text: 'Revenue increased by 14% year over year.', isHeading: false },
      ],
    },
  ];

  const docxBytes = await createDocxZip(pages);
  assert.ok(docxBytes.length > 500, 'Docx binary should have reasonable size');

  // Verify extraction from generated docx
  const extracted = await extractTextFromDocx(docxBytes);
  assert.ok(extracted.includes('Quarterly Financial Report'));
  assert.ok(extracted.includes('Revenue increased by 14%'));
});
