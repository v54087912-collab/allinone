/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  computeCrc32,
  computeAllChecksums,
  detectCsvDelimiter,
  parseCsv,
  formatCsv,
  csvToJson,
  convertFileSize,
  createXlsx,
  parseXlsx,
  identifyFileSignature,
  applyBulkRename,
  mergeTextFiles,
  splitTextFile,
} from './fileUtils';

describe('File Utilities Unit Tests', () => {
  it('computeCrc32 computes standard CRC32 checksums', () => {
    // Standard test vector: "123456789" -> 0xCBF43926
    const crc = computeCrc32('123456789');
    assert.strictEqual(crc, 'CBF43926');
  });

  it('computeAllChecksums computes all cryptographic hashes and size', async () => {
    const text = 'Hello, World!';
    const buffer = new TextEncoder().encode(text).buffer;
    const res = await computeAllChecksums(buffer);

    assert.strictEqual(res.sizeBytes, 13);
    assert.ok(res.md5.length === 32);
    assert.ok(res.sha1.length === 40);
    assert.ok(res.sha256.length === 64);
    assert.ok(res.sha512.length === 128);
    assert.ok(res.crc32.length === 8);
  });

  it('detectCsvDelimiter correctly detects commas, tabs, and semicolons', () => {
    assert.strictEqual(detectCsvDelimiter('id,name,role\n1,Alice,Dev'), ',');
    assert.strictEqual(detectCsvDelimiter('id\tname\trole\n1\tAlice\tDev'), '\t');
    assert.strictEqual(detectCsvDelimiter('id;name;role\n1;Alice;Dev'), ';');
    assert.strictEqual(detectCsvDelimiter('id|name|role\n1|Alice|Dev'), '|');
  });

  it('parseCsv and formatCsv round trip with quoted values and commas', () => {
    const csv = 'id,name,notes\n1,"Doe, John","Hello ""World"""\n2,Jane,Simple';
    const rows = parseCsv(csv);

    assert.strictEqual(rows.length, 3);
    assert.strictEqual(rows[1][1], 'Doe, John');
    assert.strictEqual(rows[1][2], 'Hello "World"');

    const formatted = formatCsv(rows, ',');
    const reParsed = parseCsv(formatted);
    assert.deepStrictEqual(reParsed, rows);
  });

  it('csvToJson converts to objects, arrays, and columnar formats', () => {
    const csv = 'id,active,price,name\n101,true,19.99,Widget\n102,false,25.50,Gadget';

    // 1. Objects
    const jsonObj = JSON.parse(csvToJson(csv, { outputMode: 'objects', inferTypes: true }));
    assert.strictEqual(jsonObj.length, 2);
    assert.strictEqual(jsonObj[0].id, 101);
    assert.strictEqual(jsonObj[0].active, true);
    assert.strictEqual(jsonObj[0].price, 19.99);
    assert.strictEqual(jsonObj[0].name, 'Widget');

    // 2. Arrays
    const jsonArr = JSON.parse(csvToJson(csv, { outputMode: 'arrays', inferTypes: true }));
    assert.strictEqual(jsonArr.length, 3); // header + 2 rows
    assert.strictEqual(jsonArr[1][0], 101);

    // 3. Columnar
    const jsonCol = JSON.parse(csvToJson(csv, { outputMode: 'columnar', inferTypes: true }));
    assert.deepStrictEqual(jsonCol.name, ['Widget', 'Gadget']);
    assert.deepStrictEqual(jsonCol.active, [true, false]);
  });

  it('convertFileSize calculates decimal and binary conversions', () => {
    // 1024 MiB -> 1 GiB or 1073741824 bytes
    const res = convertFileSize(1, 'GiB');
    assert.strictEqual(res.bytes, 1073741824);

    const mib = res.conversions.find((c) => c.unit === 'MiB');
    assert.strictEqual(mib?.value, 1024);

    const kb = res.conversions.find((c) => c.unit === 'KB');
    assert.strictEqual(kb?.value, 1073741.824);
  });

  it('createXlsx and parseXlsx round-trip spreadsheet data via JSZip', async () => {
    const originalRows = [
      ['Product ID', 'Product Name', 'Price', 'Stock'],
      ['P100', 'Laptop Pro', '1299.99', '42'],
      ['P200', 'Wireless Mouse', '29.50', '150'],
    ];

    const xlsxBlob = await createXlsx(originalRows, 'Inventory');
    assert.ok(xlsxBlob.size > 0);

    const buffer = await xlsxBlob.arrayBuffer();
    const parsed = await parseXlsx(buffer);

    assert.ok(parsed.sheetNames.includes('Inventory'));
    const rows = parsed.sheets['Inventory'];
    assert.strictEqual(rows.length, 3);
    assert.strictEqual(rows[0][0], 'Product ID');
    assert.strictEqual(rows[1][1], 'Laptop Pro');
    assert.strictEqual(rows[2][2], '29.50');
  });

  it('identifyFileSignature identifies file magic numbers', () => {
    // PNG magic
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.strictEqual(identifyFileSignature(pngBytes).format, 'PNG');

    // PDF magic: %PDF
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    assert.strictEqual(identifyFileSignature(pdfBytes).format, 'PDF');

    // ZIP magic: PK..
    const zipBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    assert.ok(identifyFileSignature(zipBytes).format.includes('ZIP'));

    // Plain text
    const textBytes = new TextEncoder().encode('Hello, this is regular text');
    assert.strictEqual(identifyFileSignature(textBytes).format, 'Plain Text');
  });

  it('applyBulkRename handles prefix, suffix, regex, case, and sequence numbering', () => {
    const files = ['photo one.jpg', 'PHOTO TWO.png', 'photo three.webp'];
    const results = applyBulkRename(files, {
      prefix: 'IMG-',
      suffix: '-v2',
      findText: 'photo',
      replaceText: 'shot',
      ignoreCase: true,
      caseTransform: 'lower',
      replaceSpaces: 'dash',
      sequence: {
        enabled: true,
        start: 1,
        padding: 3,
        position: 'prefix',
      },
      changeExtension: 'jpeg',
    });

    assert.strictEqual(results.length, 3);
    assert.strictEqual(results[0].newName, 'IMG-001-shot-one-v2.jpeg');
    assert.strictEqual(results[0].conflict, false);
    assert.strictEqual(results[1].newName, 'IMG-002-shot-two-v2.jpeg');
  });

  it('mergeTextFiles merges files with delimiters and comments', () => {
    const files = [
      { name: 'part1.txt', content: 'First line.' },
      { name: 'part2.txt', content: 'Second line.' },
    ];

    const merged = mergeTextFiles(files, {
      separator: 'double-newline',
      headerStyle: 'hash',
    });

    assert.ok(merged.includes('### File: part1.txt\nFirst line.'));
    assert.ok(merged.includes('### File: part2.txt\nSecond line.'));
    assert.ok(merged.includes('\n\n'));
  });

  it('splitTextFile splits content by line count and preserves CSV header', () => {
    const csvContent = 'id,name\n1,A\n2,B\n3,C\n4,D';
    const parts = splitTextFile(csvContent, 'data.csv', {
      mode: 'lines',
      lineCount: 2,
      preserveCsvHeader: true,
    });

    assert.strictEqual(parts.length, 2);
    assert.strictEqual(parts[0].fileName, 'data_part_001.csv');
    assert.ok(parts[0].content.startsWith('id,name\n1,A\n2,B'));
    assert.ok(parts[1].content.startsWith('id,name\n3,C\n4,D'));
  });
});
