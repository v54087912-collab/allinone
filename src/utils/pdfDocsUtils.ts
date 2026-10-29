/**
 * PDF & Docs Viewer and Editor Utilities
 * Supports:
 * - Document type detection (.pdf, .docx, .txt, .md, etc.)
 * - Text statistics calculation (words, characters, paragraphs, reading time)
 * - Safe keyword search and highlighting
 * - Viewport zoom and rotation calculations
 * - Page array reordering, duplication, and management
 */

export type DocumentType = 'pdf' | 'docx' | 'txt' | 'md' | 'json' | 'html' | 'other';

export interface DocumentStats {
  words: number;
  chars: number;
  lines: number;
  paragraphs: number;
  readingTimeMin: number;
}

/**
 * Detects document type based on filename extension and optional MIME type.
 */
export function detectDocumentType(filename: string, mimeType?: string): DocumentType {
  const lowerName = filename.toLowerCase().trim();
  const lowerMime = (mimeType || '').toLowerCase().trim();

  if (lowerName.endsWith('.pdf') || lowerMime === 'application/pdf') {
    return 'pdf';
  }
  if (
    lowerName.endsWith('.docx') ||
    lowerMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }
  if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) {
    return 'md';
  }
  if (lowerName.endsWith('.json') || lowerMime === 'application/json') {
    return 'json';
  }
  if (lowerName.endsWith('.html') || lowerName.endsWith('.htm') || lowerMime === 'text/html') {
    return 'html';
  }
  if (lowerName.endsWith('.txt') || lowerName.endsWith('.rtf') || lowerMime.startsWith('text/')) {
    return 'txt';
  }

  return 'other';
}

/**
 * Calculates comprehensive document statistics (words, chars, lines, paragraphs, reading time).
 */
export function calculateDocumentStats(text: string): DocumentStats {
  if (!text || !text.trim()) {
    return { words: 0, chars: 0, lines: 0, paragraphs: 0, readingTimeMin: 0 };
  }

  const trimmed = text.trim();
  const chars = text.length;
  const lines = text.split(/\r\n|\r|\n/).length;

  const words = (trimmed.match(/\S+/g) || []).length;
  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0).length;

  const readingTimeMin = Math.max(1, Math.ceil(words / 200));

  return {
    words,
    chars,
    lines,
    paragraphs,
    readingTimeMin,
  };
}

/**
 * Escapes special HTML characters to prevent XSS.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Safely highlights keyword occurrences in plain text for document search.
 */
export function highlightMatches(
  text: string,
  query: string,
  highlightClass = 'bg-yellow-300 dark:bg-yellow-600/70 text-slate-900 dark:text-white px-0.5 rounded-xs font-semibold'
): { html: string; matchCount: number } {
  if (!query || !query.trim() || !text) {
    return { html: escapeHtml(text), matchCount: 0 };
  }

  const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  let matchCount = 0;

  // Split on matches while escaping surrounding text
  const parts = text.split(regex);
  const result: string[] = [];

  for (const part of parts) {
    if (part.toLowerCase() === query.trim().toLowerCase()) {
      matchCount++;
      result.push(`<mark class="${highlightClass}">${escapeHtml(part)}</mark>`);
    } else {
      result.push(escapeHtml(part));
    }
  }

  return { html: result.join(''), matchCount };
}

/**
 * Clamps zoom scale between min (default 0.25) and max (default 3.0).
 */
export function clampZoom(zoom: number, min = 0.25, max = 3.0): number {
  if (isNaN(zoom)) return 1.0;
  return Math.min(max, Math.max(min, Math.round(zoom * 100) / 100));
}

/**
 * Normalizes rotation angle to 0, 90, 180, or 270 degrees.
 */
export function normalizeRotation(currentAngle: number, delta: number): number {
  const combined = (currentAngle + delta) % 360;
  return combined < 0 ? combined + 360 : combined;
}

/**
 * Safely parses a 1-based page jump input string.
 */
export function parsePageJump(input: string, totalPages: number): number | null {
  if (totalPages <= 0) return null;
  const num = parseInt(input.trim(), 10);
  if (isNaN(num) || num < 1 || num > totalPages) return null;
  return num;
}

/**
 * Reorders a list of page indices by moving an item from fromIndex to toIndex.
 */
export function reorderPagesList<T>(pages: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex < 0 ||
    fromIndex >= pages.length ||
    toIndex < 0 ||
    toIndex >= pages.length ||
    fromIndex === toIndex
  ) {
    return [...pages];
  }

  const copy = [...pages];
  const [removed] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, removed);
  return copy;
}

/**
 * Duplicates a page at a given index.
 */
export function duplicatePageInList<T>(pages: T[], index: number): T[] {
  if (index < 0 || index >= pages.length) return [...pages];
  const copy = [...pages];
  copy.splice(index + 1, 0, copy[index]);
  return copy;
}

/**
 * Deletes a page at a given index if there is more than 1 page.
 */
export function deletePageFromList<T>(pages: T[], index: number): T[] {
  if (pages.length <= 1 || index < 0 || index >= pages.length) {
    return [...pages];
  }
  const copy = [...pages];
  copy.splice(index, 1);
  return copy;
}
