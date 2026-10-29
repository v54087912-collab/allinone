import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatJson,
  minifyJson,
  jsonToCsv,
  encodeHtmlEntities,
  decodeHtmlEntities,
  computeHash,
  decodeJwt,
  formatXml,
  minifyXml,
  formatSql,
  minifySql,
  minifyHtml,
  minifyCss,
  minifyJs,
  buildCron,
  describeCron,
  convertColorAll,
} from './devUtils.ts';

describe('Developer Utilities', () => {
  it('formatJson beautifies valid JSON and detects invalid JSON', () => {
    const valid = '{"name":"Alice","age":30}';
    const formatted = formatJson(valid, 2);
    assert.strictEqual(formatted.isValid, true);
    assert.strictEqual(formatted.formatted.includes('\n  "name": "Alice"'), true);

    const invalid = '{"name": "Alice", age: }';
    const errorRes = formatJson(invalid);
    assert.strictEqual(errorRes.isValid, false);
    assert.ok(errorRes.error);
  });

  it('minifyJson compresses JSON to single line', () => {
    const multiline = `{\n  "status": "ok",\n  "code": 200\n}`;
    const min = minifyJson(multiline);
    assert.strictEqual(min.isValid, true);
    assert.strictEqual(min.formatted, '{"status":"ok","code":200}');
  });

  it('jsonToCsv converts array of objects to delimited CSV', () => {
    const jsonStr = JSON.stringify([
      { id: 1, name: 'Alice', city: 'New York' },
      { id: 2, name: 'Bob, Jr.', city: 'San Francisco' },
    ]);
    const res = jsonToCsv(jsonStr);
    assert.strictEqual(res.rowCount, 2);
    assert.deepStrictEqual(res.headers, ['id', 'name', 'city']);
    assert.strictEqual(res.csv.includes('id,name,city'), true);
    assert.strictEqual(res.csv.includes('"Bob, Jr."'), true);
  });

  it('encodeHtmlEntities and decodeHtmlEntities round trip properly', () => {
    const raw = '<div class="alert">5 > 2 & 1 < 3</div>';
    const encoded = encodeHtmlEntities(raw);
    assert.strictEqual(encoded.includes('&lt;div'), true);
    assert.strictEqual(encoded.includes('&amp;'), true);
    assert.strictEqual(encoded.includes('&gt;'), true);

    const decoded = decodeHtmlEntities(encoded);
    assert.strictEqual(decoded, raw);
  });

  it('computeHash computes valid MD5 and SHA-256 hashes', async () => {
    const text = 'hello world';
    const md5Hash = await computeHash(text, 'MD5');
    assert.strictEqual(md5Hash, '5eb63bbbe01eeed093cb22bb8f5acdc3');

    const sha256Hash = await computeHash(text, 'SHA-256');
    assert.strictEqual(sha256Hash, 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('decodeJwt unpacks header and payload accurately', () => {
    // Standard test JWT with exp in the future
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoyNTI0NjA4MDAwfQ.dummy-sig';
    const res = decodeJwt(token);
    assert.strictEqual(res.header.alg, 'HS256');
    assert.strictEqual(res.payload.name, 'John Doe');
    assert.strictEqual(res.payload.admin, true);
    assert.strictEqual(res.isExpired, false);
    assert.strictEqual(res.signature, 'dummy-sig');
  });

  it('formatXml and minifyXml indent and collapse tags', () => {
    const xml = '<root><child id="1">Hello</child><child id="2">World</child></root>';
    const fmt = formatXml(xml);
    assert.strictEqual(fmt.isValid, true);
    assert.strictEqual(fmt.formatted.includes('<root>\n'), true);

    const min = minifyXml(fmt.formatted);
    assert.strictEqual(min, xml);
  });

  it('formatSql and minifySql format query keywords and clauses', () => {
    const sql = 'select id, name from users where age > 21 and active = 1 order by name desc;';
    const formatted = formatSql(sql);
    assert.strictEqual(formatted.includes('SELECT'), true);
    assert.strictEqual(formatted.includes('\nFROM'), true);
    assert.strictEqual(formatted.includes('\nWHERE'), true);

    const min = minifySql(formatted);
    assert.strictEqual(min.includes('\n'), false);
  });

  it('minifyHtml, minifyCss, and minifyJs remove comments and collapse spaces', () => {
    const html = '  <div> \n  <!-- comment --> \n <span>text</span> \n </div> ';
    assert.strictEqual(minifyHtml(html), '<div><span>text</span></div>');

    const css = 'body { \n  color: red; \n  /* comment */ \n  margin: 0; \n}';
    assert.strictEqual(minifyCss(css), 'body{color:red;margin:0}');

    const js = 'function test() { \n // comment \n return 42; \n }';
    assert.strictEqual(minifyJs(js).includes('// comment'), false);
  });

  it('buildCron and describeCron compose and explain schedules', () => {
    const cron = buildCron('*/15', '*', '*', '*', '*');
    assert.strictEqual(cron, '*/15 * * * *');
    assert.strictEqual(describeCron(cron), 'Every 15 minutes');
  });

  it('convertColorAll accurately converts HEX to RGB, HSL, and CMYK', () => {
    const res = convertColorAll('#FF0000');
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.hex, '#FF0000');
    assert.strictEqual(res.rgb, 'rgb(255, 0, 0)');
    assert.strictEqual(res.hsl, 'hsl(0, 100%, 50%)');
    assert.strictEqual(res.cmyk, 'cmyk(0%, 100%, 100%, 0%)');
  });
});
