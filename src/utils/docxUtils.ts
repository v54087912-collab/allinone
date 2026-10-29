/**
 * DOCX (Word Document) Generation and Parsing Utility Functions
 * Supports:
 * - Grouping raw PDF text content items into structured lines and paragraphs
 * - Generating 100% valid Microsoft Word OpenXML (.docx) files using JSZip
 * - Extracting text, paragraphs, headings, and EMBEDDED IMAGES from uploaded .docx files
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
  imageDataUrl?: string;
  imageType?: 'png' | 'jpeg';
}

export interface PageTextContent {
  pageNumber: number;
  paragraphs: ExtractedParagraph[];
}

export interface DocxBlock {
  type: 'paragraph' | 'heading' | 'image';
  text?: string;
  isHeading?: boolean;
  dataUrl?: string; // base64 data url for images (data:image/png;base64,...)
  rawBytes?: Uint8Array;
  mimeType?: string;
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
 * Supports paragraphs, headings, page breaks, AND EMBEDDED IMAGES.
 */
export async function createDocxZip(pages: PageTextContent[]): Promise<Uint8Array> {
  const zip = new JSZip();

  // Track embedded images
  interface DocxImageEntry {
    rId: string;
    zipPath: string;
    bytes: Uint8Array;
    extension: string;
  }
  const embeddedImages: DocxImageEntry[] = [];
  let imageCounter = 0;

  // 1. First pass: find images and prepare media entries
  pages.forEach((page) => {
    page.paragraphs.forEach((p) => {
      if (p.imageDataUrl) {
        imageCounter++;
        const parts = p.imageDataUrl.split(',');
        const base64Data = parts.length > 1 ? parts[1] : parts[0];
        const isJpg = p.imageDataUrl.includes('jpeg') || p.imageDataUrl.includes('jpg');
        const ext = isJpg ? 'jpeg' : 'png';
        const binStr = atob(base64Data);
        const bytes = new Uint8Array(binStr.length);
        for (let b = 0; b < binStr.length; b++) {
          bytes[b] = binStr.charCodeAt(b);
        }

        const rId = `rIdImg${imageCounter}`;
        const zipPath = `media/image${imageCounter}.${ext}`;
        embeddedImages.push({ rId, zipPath, bytes, extension: ext });
      }
    });
  });

  // Write images to zip
  embeddedImages.forEach((img) => {
    zip.file(`word/${img.zipPath}`, img.bytes);
  });

  // 2. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  // 3. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // 4. word/_rels/document.xml.rels
  let docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`;
  embeddedImages.forEach((img) => {
    docRelsXml += `
  <Relationship Id="${img.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${img.zipPath}"/>`;
  });
  docRelsXml += `
</Relationships>`;
  zip.file('word/_rels/document.xml.rels', docRelsXml);

  // 5. word/document.xml
  let documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>`;

  let currentImgIndex = 0;

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
      // Check for image
      if (p.imageDataUrl && currentImgIndex < embeddedImages.length) {
        const imgEntry = embeddedImages[currentImgIndex++];
        documentXml += `
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="180" w:after="180"/>
      </w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="5486400" cy="3657600"/>
            <wp:docPr id="${currentImgIndex}" name="Picture ${currentImgIndex}"/>
            <a:graphic>
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic>
                  <pic:nvPicPr>
                    <pic:cNvPr id="${currentImgIndex}" name="Image ${currentImgIndex}"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="${imgEntry.rId}"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="5486400" cy="3657600"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>`;
        return;
      }

      const escaped = escapeXml(p.text || '');
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
 * Extracts structured content (paragraphs, headings, AND embedded images) from a .docx binary file.
 */
export async function extractDocxContent(buffer: ArrayBuffer | Uint8Array): Promise<DocxBlock[]> {
  const zip = await JSZip.loadAsync(buffer);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Invalid Word document: word/document.xml not found.');
  }

  // 1. Build relationships map (e.g. rId4 -> media/image1.png)
  const relsMap: Record<string, string> = {};
  const relsFile = zip.file('word/_rels/document.xml.rels');
  if (relsFile) {
    try {
      const relsXml = await relsFile.async('text');
      const relRegex = /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g;
      let relMatch: RegExpExecArray | null;
      while ((relMatch = relRegex.exec(relsXml)) !== null) {
        relsMap[relMatch[1]] = relMatch[2];
      }
    } catch (e) {
      console.warn('Could not parse docx relationships:', e);
    }
  }

  const xmlText = await docXmlFile.async('text');
  const blocks: DocxBlock[] = [];

  // Extract paragraphs in sequential order
  const pRegex = /<w:p(?: [^>]*)?>([\s\S]*?)<\/w:p>/g;
  let pMatch: RegExpExecArray | null;

  while ((pMatch = pRegex.exec(xmlText)) !== null) {
    const pContent = pMatch[1];

    // Check for images inside this paragraph
    const blipMatch =
      /<a:blip[^>]*r:embed="([^"]+)"/i.exec(pContent) ||
      /<v:imagedata[^>]*r:id="([^"]+)"/i.exec(pContent) ||
      /embed="([^"]+)"/i.exec(pContent);

    if (blipMatch) {
      const rId = blipMatch[1];
      const target = relsMap[rId] || rId;
      // Clean path to point inside zip
      const cleanPath = target.startsWith('word/')
        ? target
        : target.startsWith('/')
        ? target.substring(1)
        : 'word/' + target.replace(/^(\.\.\/)+/, '');

      const imgFile = zip.file(cleanPath);
      if (imgFile) {
        try {
          const rawBytes = await imgFile.async('uint8array');
          const base64 = await imgFile.async('base64');
          const isJpg = cleanPath.toLowerCase().endsWith('.jpg') || cleanPath.toLowerCase().endsWith('.jpeg');
          const mimeType = isJpg ? 'image/jpeg' : 'image/png';
          blocks.push({
            type: 'image',
            dataUrl: `data:${mimeType};base64,${base64}`,
            rawBytes,
            mimeType,
          });
        } catch (imgReadErr) {
          console.warn('Could not read image from docx zip:', cleanPath, imgReadErr);
        }
      }
    }

    // Check for text inside this paragraph
    const tRegex = /<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g;
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
      // Determine if heading
      const isHeading =
        /w:pStyle w:val="Heading/i.test(pContent) ||
        (/w:b/i.test(pContent) && clean.length < 80 && !clean.endsWith('.')) ||
        (clean.length < 60 && !clean.endsWith('.') && clean.length > 2);

      blocks.push({
        type: isHeading ? 'heading' : 'paragraph',
        text: clean,
        isHeading,
      });
    }
  }

  return blocks;
}

/**
 * Extracts plain text and paragraph structure from a .docx binary file.
 */
export async function extractTextFromDocx(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const blocks = await extractDocxContent(buffer);
  return blocks
    .filter((b) => b.text)
    .map((b) => b.text)
    .join('\n\n');
}

/**
 * Extracts HTML string from a .docx file for rich visual rendering in the Viewer and Editor.
 * Includes both text and embedded images with responsive CSS classes.
 */
export async function extractDocxHtml(buffer: ArrayBuffer | Uint8Array): Promise<{
  html: string;
  text: string;
  blocks: DocxBlock[];
  imageCount: number;
}> {
  const blocks = await extractDocxContent(buffer);
  const htmlParts: string[] = [];
  const textParts: string[] = [];

  for (const b of blocks) {
    if (b.type === 'image' && b.dataUrl) {
      htmlParts.push(
        `<div class="my-6 text-center"><img src="${b.dataUrl}" alt="Document Image" class="max-w-full h-auto mx-auto rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 object-contain" style="max-height: 520px;" /></div>`
      );
    } else if (b.isHeading && b.text) {
      textParts.push(b.text);
      htmlParts.push(
        `<h3 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-3 tracking-tight">${escapeXml(
          b.text
        )}</h3>`
      );
    } else if (b.text) {
      textParts.push(b.text);
      htmlParts.push(
        `<p class="text-slate-700 dark:text-slate-300 leading-relaxed mb-4 text-justify">${escapeXml(
          b.text
        )}</p>`
      );
    }
  }

  const imageCount = blocks.filter((b) => b.type === 'image').length;

  return {
    html: htmlParts.join('\n'),
    text: textParts.join('\n\n'),
    blocks,
    imageCount,
  };
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
