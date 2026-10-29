/**
 * PDF Metadata Inspection & Editing Utility Functions
 * Supports:
 * - Extracting title, author, subject, keywords, producer, creator, timestamps
 * - Updating metadata properties in pdf-lib
 * - Stripping all metadata for complete document privacy
 */
import { PDFDocument } from 'pdf-lib';

export interface PdfMetadataInfo {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
  pageCount: number;
}

/**
 * Extracts all standard metadata fields from a PDFDocument.
 */
export function extractPdfMetadata(pdfDoc: PDFDocument): PdfMetadataInfo {
  const title = pdfDoc.getTitle() || '';
  const author = pdfDoc.getAuthor() || '';
  const subject = pdfDoc.getSubject() || '';
  const keywords = pdfDoc.getKeywords() ? pdfDoc.getKeywords()!.split(/\s*[,;\s]+\s*/).map((k) => k.trim()).filter(Boolean) : [];
  const creator = pdfDoc.getCreator() || '';
  const producer = pdfDoc.getProducer() || '';
  const cDate = pdfDoc.getCreationDate();
  const mDate = pdfDoc.getModificationDate();

  return {
    title,
    author,
    subject,
    keywords,
    creator,
    producer,
    creationDate: cDate ? cDate.toISOString() : '',
    modificationDate: mDate ? mDate.toISOString() : '',
    pageCount: pdfDoc.getPageCount(),
  };
}

/**
 * Updates metadata on a PDFDocument.
 */
export function updatePdfMetadata(
  pdfDoc: PDFDocument,
  updates: Partial<{
    title: string;
    author: string;
    subject: string;
    keywords: string[];
  }>
): void {
  if (updates.title !== undefined) pdfDoc.setTitle(updates.title);
  if (updates.author !== undefined) pdfDoc.setAuthor(updates.author);
  if (updates.subject !== undefined) pdfDoc.setSubject(updates.subject);
  if (updates.keywords !== undefined) pdfDoc.setKeywords(updates.keywords);
  pdfDoc.setModificationDate(new Date());
}

/**
 * Strips all personal identifying metadata from a PDFDocument.
 */
export function stripPdfMetadata(pdfDoc: PDFDocument): void {
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setCreator('');
  pdfDoc.setProducer('Toolora (Sanitized)');
}
