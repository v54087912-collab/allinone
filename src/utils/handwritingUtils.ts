/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// 1. Bionic Reading Algorithm
// ==========================================

export function convertToBionic(text: string, fixationPercent: number = 0.5): string {
  if (!text) return '';

  // Match words, whitespace, and punctuation separately
  return text.replace(/([a-zA-Z0-9]+)/g, (word) => {
    const len = word.length;
    if (len === 1) return `<b>${word}</b>`;

    // Fixation length based on percentage, at least 1, at most len
    const fixLen = Math.min(len, Math.max(1, Math.ceil(len * fixationPercent)));
    const boldPart = word.slice(0, fixLen);
    const rest = word.slice(fixLen);
    return `<b>${boldPart}</b>${rest}`;
  });
}

// ==========================================
// 2. Whitespace & Text Cleaner
// ==========================================

export interface WhitespaceOptions {
  collapseSpaces?: boolean;
  trimLines?: boolean;
  removeBlankLines?: boolean;
  stripTabs?: boolean;
  unwrapLines?: boolean;
}

export function cleanWhitespace(text: string, options: WhitespaceOptions = {}): string {
  let result = text;

  if (options.stripTabs) {
    result = result.replace(/\t/g, ' ');
  }

  if (options.collapseSpaces !== false) {
    result = result.replace(/[ \t]{2,}/g, ' ');
  }

  if (options.trimLines !== false) {
    result = result
      .split('\n')
      .map(line => line.trim())
      .join('\n');
  }

  if (options.removeBlankLines) {
    result = result.replace(/\n\s*\n+/g, '\n');
  }

  if (options.unwrapLines) {
    result = result.replace(/\n+/g, ' ');
  }

  return result.trim();
}

// ==========================================
// 3. Letter Counter & Platform Limits
// ==========================================

export interface PlatformLimit {
  name: string;
  limit: number;
  current: number;
  remaining: number;
  percent: number;
  isOver: boolean;
}

export interface LetterCountResult {
  letters: number;
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  digits: number;
  specialChars: number;
  limits: Record<string, PlatformLimit>;
}

export function analyzeLetterCounts(text: string): LetterCountResult {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const letters = (text.match(/[\p{L}]/gu) || []).length;
  const digits = (text.match(/[0-9]/g) || []).length;
  const specialChars = charactersNoSpaces - letters - digits;

  const words = text.trim() ? (text.trim().match(/\S+/g) || []).length : 0;
  const sentences = text.trim() ? (text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text.trim()]).filter(s => s.trim().length > 0).length : 0;
  const paragraphs = text.trim() ? text.split(/\n+/).filter(p => p.trim().length > 0).length : 0;

  const platformSpecs: Record<string, { name: string; limit: number }> = {
    twitter: { name: 'Twitter / X', limit: 280 },
    sms: { name: 'SMS (Single Part)', limit: 160 },
    metaTitle: { name: 'Google Meta Title', limit: 60 },
    metaDesc: { name: 'Google Meta Description', limit: 160 },
    instagram: { name: 'Instagram Caption', limit: 2200 },
    linkedin: { name: 'LinkedIn Post', limit: 3000 }
  };

  const limits: Record<string, PlatformLimit> = {};
  for (const [key, spec] of Object.entries(platformSpecs)) {
    const remaining = spec.limit - characters;
    const percent = Math.min(100, Math.round((characters / spec.limit) * 100));
    limits[key] = {
      name: spec.name,
      limit: spec.limit,
      current: characters,
      remaining,
      percent,
      isOver: characters > spec.limit
    };
  }

  return {
    letters,
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    digits,
    specialChars: Math.max(0, specialChars),
    limits
  };
}

// ==========================================
// 4. Handwriting Fonts & Paper Configurations
// ==========================================

export interface HandwritingFontPreset {
  id: string;
  name: string;
  file: string;
  fallback: string;
}

export const HANDWRITING_FONTS: HandwritingFontPreset[] = [
  { id: 'antony-lark', name: 'Antony Lark', file: '/fonts/QEAntonyLark.ttf', fallback: 'cursive' },
  { id: 'bev', name: 'Bev Handwriting', file: '/fonts/QEBEV.ttf', fallback: 'cursive' },
  { id: 'braden-hill', name: 'Braden Hill Script', file: '/fonts/QEBradenHill.ttf', fallback: 'cursive' },
  { id: 'caroline-mutiboko', name: 'Caroline Mutiboko', file: '/fonts/QECarolineMutiboko.ttf', fallback: 'cursive' },
  { id: 'dave-mergens', name: 'Dave Mergens', file: '/fonts/QEDaveMergens.ttf', fallback: 'cursive' },
  { id: 'david-reid', name: 'David Reid Casual', file: '/fonts/QEDavidReid.ttf', fallback: 'cursive' },
  { id: 'kunjar-script', name: 'Kunjar Script', file: '/fonts/QEKunjarScript.ttf', fallback: 'cursive' }
];

export interface PaperPreset {
  id: string;
  name: string;
  bgColor: string;
  lineColor: string;
  marginColor?: string;
  hasRules: boolean;
  hasMargin: boolean;
}

export const PAPER_PRESETS: PaperPreset[] = [
  { id: 'ruled', name: 'Ruled Notebook Paper', bgColor: '#ffffff', lineColor: '#cbd5e1', marginColor: '#fca5a5', hasRules: true, hasMargin: true },
  { id: 'blank', name: 'Blank White Paper', bgColor: '#ffffff', lineColor: 'transparent', hasRules: false, hasMargin: false },
  { id: 'legal', name: 'Yellow Legal Pad', bgColor: '#fef9c3', lineColor: '#e2e8f0', marginColor: '#f87171', hasRules: true, hasMargin: true },
  { id: 'parchment', name: 'Vintage Parchment', bgColor: '#fef3c7', lineColor: '#d97706', marginColor: '#b45309', hasRules: true, hasMargin: false }
];
