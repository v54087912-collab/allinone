/**
 * DOCX (Word Document) Generation and Parsing Utility Functions
 * Supports:
 * - Grouping raw PDF text content items into structured lines and paragraphs
 * - Generating 100% valid Microsoft Word OpenXML (.docx) files using JSZip
 * - Extracting text and structure from uploaded .docx files
 */
import JSZip from 'jszip';

export interface ExtractedPdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractedParagraph {
  text: string;
  isHeading: boolean;
}

export interface PageTextContent {
  pageNumber: number;
  paragraphs: ExtractedParagraph[];
}

/**
 * Escapes characters for safe inclusion in OpenXML/XML strings.
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Groups raw extracted PDF text items by vertical coordinate (Y) and horizontal continuity (X).
 * Identifies likely headings based on font height.
 */
export function groupTextItemsIntoParagraphs(
  items: ExtractedPdfTextItem[],
  lineYThreshold = 3
): ExtractedParagraph[] {
  if (items.length === 0) return [];

  // Sort items in natural reading order: top-to-bottom (PDF Y descends), then left-to-right (X ascends)
  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) <= lineYThreshold) {
      return a.x - b.x;
    }
    return b.y - a.y; // In PDF, higher Y is closer to the top of the page
  });

  // Calculate median font height to distinguish headings from regular body text
  const heights = sorted.map((item) => item.height).filter((h) => h > 0);
  heights.sort((a, b) => a - b);
  const medianHeight = heights.length > 0 ? heights[Math.floor(heights.length / 2)] : 12;
  const headingHeightThreshold = medianHeight * 1.35;

  const lines: Array<{ text: string; height: number; y: number }> = [];
  let currentLine: { parts: string[]; height: number; y: number } | null = null;

  for (const item of sorted) {
    if (!item.str.trim()) continue;

    if (!currentLine) {
      currentLine = { parts: [item.str], height: item.height, y: item.y };
    } else if (Math.abs(item.y - currentLine.y) <= lineYThreshold) {
      // Same line: append text
      currentLine.parts.push(item.str);
      currentLine.height = Math.max(currentLine.height, item.height);
    } else {
      // New line
      lines.push({
        text: currentLine.parts.join(' ').replace(/\s+/g, ' ').trim(),
        height: currentLine.height,
        y: currentLine.y,
      });
      currentLine = { parts: [item.str], height: item.height, y: item.y };
    }
  }

  if (currentLine) {
    lines.push({
      text: currentLine.parts.join(' ').replace(/\s+/g, ' ').trim(),
      height: currentLine.height,
      y: currentLine.y,
    });
  }

  // Merge contiguous lines into paragraphs
  const paragraphs: ExtractedParagraph[] = [];
  let currentPara: { text: string; isHeading: boolean; lastY: number; lastH: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeading = line.height >= headingHeightThreshold;

    if (isHeading) {
      if (currentPara) {
        paragraphs.push({ text: currentPara.text, isHeading: currentPara.isHeading });
        currentPara = null;
      }
      paragraphs.push({ text: line.text, isHeading: true });
      continue;
    }

    if (!currentPara) {
      currentPara = { text: line.text, isHeading: false, lastY: line.y, lastH: line.height };
    } else {
      // Check if vertical distance between lines indicates a new paragraph (gap > 1.8x line height)
      const verticalGap = Math.abs(currentPara.lastY - line.y);
      if (verticalGap > currentPara.lastH * 1.8) {
        paragraphs.push({ text: currentPara.text, isHeading: currentPara.isHeading });
        currentPara = { text: line.text, isHeading: false, lastY: line.y, lastH: line.height };
      } else {
        currentPara.text += ' ' + line.text;
        currentPara.lastY = line.y;
      }
    }
  }

  if (currentPara) {
    paragraphs.push({ text: currentPara.text, isHeading: currentPara.isHeading });
  }

  return paragraphs;
}

/**
 * Builds an OpenXML .docx file structure and returns the binary ZIP array buffer.
 */
export async function createDocxZip(pages: PageTextContent[]): Promise<Uint8Array> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // 3. word/document.xml
  let documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>`;

  pages.forEach((page, pIdx) => {
    // Add page break if not first page
    if (pIdx > 0) {
      documentXml += `
    <w:p>
      <w:r>
        <w:br w:type="page"/>
      </w:r>
    </w:p>`;
    }

    page.paragraphs.forEach((p) => {
      const escaped = escapeXml(p.text);
      if (p.isHeading) {
        documentXml += `
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
          <w:szCs w:val="32"/>
        </w:rPr>
        <w:t>${escaped}</w:t>
      </w:r>
    </w:p>`;
      } else {
        documentXml += `
    <w:p>
      <w:pPr>
        <w:spacing w:after="120" w:line="276" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="22"/>
          <w:szCs w:val="22"/>
        </w:rPr>
        <w:t>${escaped}</w:t>
      </w:r>
    </w:p>`;
      }
    });
  });

  // Section properties (Standard A4 dimensions: 11906 x 16838 twips)
  documentXml += `
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', documentXml);

  return await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Extracts plain text and paragraph structure from a .docx binary file.
 */
export async function extractTextFromDocx(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Invalid Word document: word/document.xml not found.');
  }

  const xmlText = await docXmlFile.async('text');

  // Extract paragraphs by matching <w:p>...</w:p>
  const pRegex = /<w:p(?: [^>]*)?>([\s\S]*?)<\/w:p>/g;
  const tRegex = /<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g;
  const result: string[] = [];

  let pMatch: RegExpExecArray | null;
  while ((pMatch = pRegex.exec(xmlText)) !== null) {
    const pContent = pMatch[1];
    let paraText = '';
    let tMatch: RegExpExecArray | null;
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      paraText += tMatch[1];
    }
    const clean = paraText
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();
    if (clean) {
      result.push(clean);
    }
  }

  return result.join('\n\n');
}

/**
 * Convenience helper to create a Word (.docx) Blob from a simple array of paragraph strings.
 */
export async function generateDocx(paragraphs: string[]): Promise<Blob> {
  const page: PageTextContent = {
    pageNumber: 1,
    paragraphs: paragraphs.map((text) => ({ text, isHeading: false })),
  };
  const zipBytes = await createDocxZip([page]);
  return new Blob([zipBytes as any], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

