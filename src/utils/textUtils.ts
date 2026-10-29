/**
 * Text Utilities for Word Counter, Character Counter, Case Converter, Diff Checker,
 * Text Reverser, and Lorem Ipsum Generator.
 */

export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeMin: number;
  speakingTimeMin: number;
}

export function analyzeText(text: string): TextStats {
  const clean = text.trim();
  if (!clean) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeMin: 0,
      speakingTimeMin: 0,
    };
  }

  const words = clean.split(/\s+/).filter(Boolean).length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const sentences = clean.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || 1;
  const readingTimeMin = Math.ceil(words / 200);
  const speakingTimeMin = Math.ceil(words / 130);

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    readingTimeMin,
    speakingTimeMin,
  };
}

export type CaseMode =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'snake'
  | 'kebab'
  | 'pascal'
  | 'constant'
  | 'alternating';

export function convertCase(text: string, mode: CaseMode): string {
  if (!text) return '';

  switch (mode) {
    case 'upper':
      return text.toUpperCase();

    case 'lower':
      return text.toLowerCase();

    case 'title':
      return text.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
      );

    case 'sentence':
      return text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());

    case 'camel': {
      const words = text
        .trim()
        .replace(/[^\w\s-]/g, '')
        .split(/[\s_-]+/);
      return words
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.substring(1).toLowerCase()
        )
        .join('');
    }

    case 'pascal': {
      const words = text
        .trim()
        .replace(/[^\w\s-]/g, '')
        .split(/[\s_-]+/);
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase())
        .join('');
    }

    case 'snake':
      return text
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s-]+/g, '_');

    case 'kebab':
      return text
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-');

    case 'constant':
      return text
        .trim()
        .toUpperCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s-]+/g, '_');

    case 'alternating':
      return text
        .split('')
        .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
        .join('');

    default:
      return text;
  }
}

export type ReverseMode = 'chars' | 'words' | 'each-word' | 'flip';

const UPSIDE_DOWN_MAP: Record<string, string> = {
  a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ',
  j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ',
  s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z',
  A: '∀', B: '𐐒', C: 'Ɔ', D: 'ᗡ', E: 'Ǝ', F: 'Ⅎ', G: '⅁', H: 'H', I: 'I',
  J: 'ſ', K: 'ʞ', L: '˥', M: 'W', N: 'N', O: 'O', P: 'Ԁ', Q: 'Ό', R: 'ᴚ',
  S: 'S', T: '⊥', U: '∩', V: 'Λ', W: 'M', X: 'X', Y: '⅄', Z: 'Z',
  '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ', '8': '8', '9': '6', '0': '0',
  '.': '˙', ',': "'", "'": ',', '"': '„', '?': '¿', '!': '¡', '(': ')', ')': '(',
  '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '&': '⅋', '_': '‾',
};

export function reverseText(text: string, mode: ReverseMode): string {
  if (!text) return '';

  switch (mode) {
    case 'chars':
      return text.split('').reverse().join('');

    case 'words':
      return text.split(/(\s+)/).reverse().join('');

    case 'each-word':
      return text
        .split(/(\s+)/)
        .map((part) => (/\s+/.test(part) ? part : part.split('').reverse().join('')))
        .join('');

    case 'flip':
      return text
        .split('')
        .reverse()
        .map((c) => UPSIDE_DOWN_MAP[c] || c)
        .join('');

    default:
      return text;
  }
}

export interface DiffPart {
  type: 'same' | 'added' | 'removed';
  value: string;
}

/**
 * Line-by-line / Word text diff generator using dynamic programming (LCS)
 */
export function computeTextDiff(original: string, modified: string): DiffPart[] {
  const origLines = original.split(/\r?\n/);
  const modLines = modified.split(/\r?\n/);

  const N = origLines.length;
  const M = modLines.length;

  // LCS Matrix
  const dp: number[][] = Array.from({ length: N + 1 }, () => new Array(M + 1).fill(0));

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < M; j++) {
      if (origLines[i] === modLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack
  let i = N;
  let j = M;
  const result: DiffPart[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
      result.unshift({ type: 'same', value: origLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', value: modLines[j - 1] });
      j--;
    } else if (i > 0) {
      result.unshift({ type: 'removed', value: origLines[i - 1] });
      i--;
    }
  }

  return result;
}

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex', 'ea',
  'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
  'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur',
  'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt',
  'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
];

export function generateLoremIpsum(
  count: number,
  type: 'paragraphs' | 'sentences' | 'words' = 'paragraphs',
  startWithLorem = true
): string {
  const getRandomWord = () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];

  const generateSentence = (minWords = 6, maxWords = 14) => {
    const len = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
    const words = Array.from({ length: len }, getRandomWord);
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    return words.join(' ') + '.';
  };

  const generateParagraph = (sentenceCount = 4) => {
    return Array.from({ length: sentenceCount }, () => generateSentence()).join(' ');
  };

  if (type === 'words') {
    const words = Array.from({ length: count }, getRandomWord);
    if (startWithLorem && count >= 2) {
      words[0] = 'lorem';
      words[1] = 'ipsum';
    }
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    return words.join(' ');
  }

  if (type === 'sentences') {
    const sentences = Array.from({ length: count }, () => generateSentence());
    if (startWithLorem && sentences.length > 0) {
      sentences[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
    }
    return sentences.join(' ');
  }

  // Paragraphs
  const paras = Array.from({ length: count }, () => generateParagraph());
  if (startWithLorem && paras.length > 0) {
    paras[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' + paras[0];
  }
  return paras.join('\n\n');
}

export interface SentenceItem {
  text: string;
  words: number;
  characters: number;
  isLong: boolean;
}

export interface SentenceAnalysis {
  totalSentences: number;
  avgWordsPerSentence: number;
  shortestSentenceWords: number;
  longestSentenceWords: number;
  longSentencesCount: number;
  sentences: SentenceItem[];
}

export function analyzeSentences(text: string): SentenceAnalysis {
  const clean = text.trim();
  if (!clean) {
    return {
      totalSentences: 0,
      avgWordsPerSentence: 0,
      shortestSentenceWords: 0,
      longestSentenceWords: 0,
      longSentencesCount: 0,
      sentences: [],
    };
  }

  // Split on sentence-ending punctuation with positive lookbehind or regex
  const rawSentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (rawSentences.length === 0) {
    rawSentences.push(clean);
  }

  let totalWords = 0;
  let minWords = Infinity;
  let maxWords = 0;
  let longCount = 0;

  const sentenceItems: SentenceItem[] = rawSentences.map((s) => {
    const words = s.split(/\s+/).filter(Boolean).length;
    totalWords += words;
    if (words < minWords) minWords = words;
    if (words > maxWords) maxWords = words;
    const isLong = words > 25;
    if (isLong) longCount++;

    return {
      text: s,
      words,
      characters: s.length,
      isLong,
    };
  });

  const avgWords = Math.round((totalWords / rawSentences.length) * 10) / 10;

  return {
    totalSentences: rawSentences.length,
    avgWordsPerSentence: avgWords,
    shortestSentenceWords: minWords === Infinity ? 0 : minWords,
    longestSentenceWords: maxWords,
    longSentencesCount: longCount,
    sentences: sentenceItems,
  };
}

export interface SpaceCleanOptions {
  trimLeadingTrailing?: boolean;
  collapseSpaces?: boolean;
  removeEmptyLines?: boolean;
  removeTabs?: boolean;
  cleanPunctuationSpaces?: boolean;
}

export function removeExtraSpaces(text: string, options: SpaceCleanOptions = {}): string {
  const {
    trimLeadingTrailing = true,
    collapseSpaces = true,
    removeEmptyLines = false,
    removeTabs = true,
    cleanPunctuationSpaces = false,
  } = options;

  if (!text) return "";
  let lines = text.split(/\r?\n/);

  lines = lines.map((line) => {
    let l = line;
    if (removeTabs) {
      l = l.replace(/\t+/g, " ");
    }
    if (collapseSpaces) {
      l = l.replace(/[ \t]{2,}/g, " ");
    }
    if (trimLeadingTrailing) {
      l = l.trim();
    }
    if (cleanPunctuationSpaces) {
      l = l.replace(/\s+([,.;:!?])/g, "$1");
      l = l.replace(/([,.;:!?])([a-zA-Z])/g, "$1 $2");
    }
    return l;
  });

  if (removeEmptyLines) {
    lines = lines.filter((l) => l.trim().length > 0);
  }

  let result = lines.join("\n");
  if (trimLeadingTrailing) {
    result = result.trim();
  }
  return result;
}

export interface DuplicateLinesResult {
  cleanedText: string;
  originalLinesCount: number;
  uniqueLinesCount: number;
  duplicatesRemoved: number;
}

export function removeDuplicateLines(
  text: string,
  options: { caseSensitive?: boolean; trimLines?: boolean } = {}
): DuplicateLinesResult {
  const { caseSensitive = true, trimLines = true } = options;
  if (!text) {
    return {
      cleanedText: "",
      originalLinesCount: 0,
      uniqueLinesCount: 0,
      duplicatesRemoved: 0,
    };
  }

  const rawLines = text.split(/\r?\n/);
  const seen = new Set<string>();
  const uniqueLines: string[] = [];

  for (const line of rawLines) {
    const processed = trimLines ? line.trim() : line;
    const key = caseSensitive ? processed : processed.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      uniqueLines.push(processed);
    }
  }

  const duplicates = rawLines.length - uniqueLines.length;

  return {
    cleanedText: uniqueLines.join("\n"),
    originalLinesCount: rawLines.length,
    uniqueLinesCount: uniqueLines.length,
    duplicatesRemoved: duplicates,
  };
}

export type SortMode =
  | "az"
  | "za"
  | "length-asc"
  | "length-desc"
  | "natural"
  | "random"
  | "reverse";

export function sortTextLines(
  text: string,
  mode: SortMode = "az",
  caseSensitive = false
): string {
  if (!text) return "";
  const lines = text.split(/\r?\n/);

  switch (mode) {
    case "az":
      lines.sort((a, b) =>
        caseSensitive
          ? a.localeCompare(b)
          : a.toLowerCase().localeCompare(b.toLowerCase())
      );
      break;

    case "za":
      lines.sort((a, b) =>
        caseSensitive
          ? b.localeCompare(a)
          : b.toLowerCase().localeCompare(a.toLowerCase())
      );
      break;

    case "length-asc":
      lines.sort((a, b) => a.length - b.length || a.localeCompare(b));
      break;

    case "length-desc":
      lines.sort((a, b) => b.length - a.length || a.localeCompare(b));
      break;

    case "natural":
      lines.sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: caseSensitive ? "case" : "base" })
      );
      break;

    case "random": {
      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]];
      }
      break;
    }

    case "reverse":
      lines.reverse();
      break;
  }

  return lines.join("\n");
}

export interface SlugOptions {
  separator?: string;
  lowercase?: boolean;
  preserveNumbers?: boolean;
}

export function generateSlug(text: string, options: SlugOptions = {}): string {
  const { separator = "-", lowercase = true, preserveNumbers = true } = options;
  if (!text) return "";

  let res = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove accents

  if (lowercase) {
    res = res.toLowerCase();
  }

  const allowedChars = preserveNumbers ? /[^a-zA-Z0-9_\s-]/g : /[^a-zA-Z_\s-]/g;
  res = res.replace(allowedChars, "");

  // Replace spaces, underscores, and hyphens with separator
  res = res.trim().replace(/[\s\-_]+/g, separator);

  // Remove leading and trailing separators
  const esc = separator.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  res = res.replace(new RegExp(`^${esc}+|${esc}+$`, "g"), "");
  return res;
}

function countWordSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, "");
  word = word.replace(/^y/, "");
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

export interface ReadabilityScore {
  fleschEase: number;
  readingLevel: string;
  gradeLevel: number;
  gunningFog: number;
  words: number;
  sentences: number;
  syllables: number;
  complexWords: number;
  readingTimeMin: number;
}

export function calculateReadability(text: string): ReadabilityScore {
  const clean = text.trim();
  if (!clean) {
    return {
      fleschEase: 100,
      readingLevel: "Very Easy",
      gradeLevel: 0,
      gunningFog: 0,
      words: 0,
      sentences: 0,
      syllables: 0,
      complexWords: 0,
      readingTimeMin: 0,
    };
  }

  const words = clean.split(/\s+/).filter(Boolean);
  const sentences = clean.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1;

  let totalSyllables = 0;
  let complexWords = 0;
  for (const w of words) {
    const syl = countWordSyllables(w);
    totalSyllables += syl;
    if (syl >= 3) complexWords++;
  }

  const wordsPerSentence = words.length / sentences;
  const syllablesPerWord = totalSyllables / Math.max(1, words.length);

  // Flesch Reading Ease Formula
  let ease = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  ease = Math.max(0, Math.min(100, Math.round(ease * 10) / 10));

  let readingLevel = "Standard";
  if (ease >= 90) readingLevel = "Very Easy (5th Grade)";
  else if (ease >= 80) readingLevel = "Easy (6th Grade)";
  else if (ease >= 70) readingLevel = "Fairly Easy (7th Grade)";
  else if (ease >= 60) readingLevel = "Standard (8th-9th Grade)";
  else if (ease >= 50) readingLevel = "Fairly Difficult (10th-12th Grade)";
  else if (ease >= 30) readingLevel = "Difficult (College Level)";
  else readingLevel = "Very Confusing (Graduate Level)";

  // Flesch-Kincaid Grade Level
  let grade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  grade = Math.max(0, Math.round(grade * 10) / 10);

  // Gunning Fog Index: 0.4 * ((words / sentences) + 100 * (complexWords / words))
  const complexPct = (complexWords / Math.max(1, words.length)) * 100;
  let fog = 0.4 * (wordsPerSentence + complexPct);
  fog = Math.max(0, Math.round(fog * 10) / 10);

  return {
    fleschEase: ease,
    readingLevel,
    gradeLevel: grade,
    gunningFog: fog,
    words: words.length,
    sentences,
    syllables: totalSyllables,
    complexWords,
    readingTimeMin: Math.ceil(words.length / 200),
  };
}

export interface GrammarIssue {
  type: "spelling" | "repeated-word" | "punctuation" | "spacing" | "capitalization";
  message: string;
  original: string;
  replacement: string;
  index: number;
}

const COMMON_TYPOS: Record<string, string> = {
  teh: "the",
  recieve: "receive",
  seperate: "separate",
  untill: "until",
  definately: "definitely",
  occured: "occurred",
  alot: "a lot",
  wich: "which",
  truely: "truly",
  goverment: "government",
  tommorrow: "tomorrow",
  wierd: "weird",
  accomodate: "accommodate",
  beleive: "believe",
  calender: "calendar",
  embarass: "embarrass",
  enviroment: "environment",
  fourty: "forty",
  neccessary: "necessary",
  noticable: "noticeable",
  adress: "address",
  allways: "always",
  begining: "beginning",
  arguement: "argument",
  comittee: "committee",
  existance: "existence",
  forward: "forward",
  guarentee: "guarantee",
  happend: "happened",
  ignorence: "ignorance",
};

export function checkGrammarAndStyle(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  if (!text || !text.trim()) return issues;

  // 1. Repeated words ("the the", "in in")
  const repeatRegex = /\b([a-zA-Z]+)\s+\1\b/gi;
  let match: RegExpExecArray | null;
  while ((match = repeatRegex.exec(text)) !== null) {
    issues.push({
      type: "repeated-word",
      message: `Repeated word: "${match[1]}"`,
      original: match[0],
      replacement: match[1],
      index: match.index,
    });
  }

  // 2. Double punctuation (",,", ";;")
  const doublePunctRegex = /([,;])\1+/g;
  while ((match = doublePunctRegex.exec(text)) !== null) {
    issues.push({
      type: "punctuation",
      message: `Repeated punctuation: "${match[0]}"`,
      original: match[0],
      replacement: match[1],
      index: match.index,
    });
  }

  // 3. Space before punctuation ("word , word")
  const spaceBeforePunctRegex = /\s+([,.;!?])/g;
  while ((match = spaceBeforePunctRegex.exec(text)) !== null) {
    issues.push({
      type: "spacing",
      message: `Unnecessary space before "${match[1]}"`,
      original: match[0],
      replacement: match[1],
      index: match.index,
    });
  }

  // 4. Missing space after punctuation ("word.word")
  const noSpaceAfterPunctRegex = /([,.;!?])([a-zA-Z])/g;
  while ((match = noSpaceAfterPunctRegex.exec(text)) !== null) {
    issues.push({
      type: "spacing",
      message: `Missing space after "${match[1]}"`,
      original: match[0],
      replacement: `${match[1]} ${match[2]}`,
      index: match.index,
    });
  }

  // 5. Common misspellings
  const wordsWithIndices: { word: string; index: number }[] = [];
  const wordRegex = /\b[a-zA-Z]+\b/g;
  while ((match = wordRegex.exec(text)) !== null) {
    wordsWithIndices.push({ word: match[0], index: match.index });
  }

  for (const item of wordsWithIndices) {
    const lower = item.word.toLowerCase();
    if (COMMON_TYPOS[lower]) {
      const isCap = item.word[0] === item.word[0].toUpperCase();
      const rep = isCap
        ? COMMON_TYPOS[lower].charAt(0).toUpperCase() + COMMON_TYPOS[lower].slice(1)
        : COMMON_TYPOS[lower];
      issues.push({
        type: "spelling",
        message: `Possible spelling error: "${item.word}"`,
        original: item.word,
        replacement: rep,
        index: item.index,
      });
    }
  }

  // 6. Lowercase start of sentence
  const sentenceStartRegex = /(?:^|[.!?]\s+)([a-z])/g;
  while ((match = sentenceStartRegex.exec(text)) !== null) {
    const full = match[0];
    const letter = match[1];
    issues.push({
      type: "capitalization",
      message: `Sentence starts with lowercase "${letter}"`,
      original: letter,
      replacement: letter.toUpperCase(),
      index: match.index + (full.length - 1),
    });
  }

  issues.sort((a, b) => a.index - b.index);
  return issues;
}

const STOP_WORDS_SET = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can", "cannot", "could",
  "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have",
  "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is",
  "it", "its", "itself", "just", "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once",
  "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so", "some",
  "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there", "these", "they", "this",
  "those", "through", "to", "too", "under", "until", "up", "very", "was", "we", "were", "what", "when", "where",
  "which", "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
]);

export interface SummarizeResult {
  summary: string;
  originalWords: number;
  summaryWords: number;
  reductionPercentage: number;
  keySentences: string[];
  keywords: string[];
}

export function summarizeText(text: string, targetRatio = 0.35): SummarizeResult {
  const clean = text.trim();
  if (!clean) {
    return {
      summary: "",
      originalWords: 0,
      summaryWords: 0,
      reductionPercentage: 0,
      keySentences: [],
      keywords: [],
    };
  }

  const rawSentences = clean.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const wordsCount = clean.split(/\s+/).filter(Boolean).length;

  if (rawSentences.length <= 2) {
    return {
      summary: clean,
      originalWords: wordsCount,
      summaryWords: wordsCount,
      reductionPercentage: 0,
      keySentences: rawSentences,
      keywords: [],
    };
  }

  // Word frequency map
  const wordFreq: Record<string, number> = {};
  const tokens = clean
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS_SET.has(w));

  for (const t of tokens) {
    wordFreq[t] = (wordFreq[t] || 0) + 1;
  }

  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map((e) => e[0]);

  // Score sentences
  const sentenceScores = rawSentences.map((sent, index) => {
    const sWords = sent.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
    if (sWords.length === 0) return { index, sentence: sent, score: 0 };

    let score = 0;
    for (const w of sWords) {
      if (wordFreq[w]) score += wordFreq[w];
    }

    score = score / Math.sqrt(Math.max(1, sWords.length));
    if (index === 0) score *= 1.35;
    if (index === rawSentences.length - 1) score *= 1.15;

    return { index, sentence: sent, score };
  });

  const countToKeep = Math.max(1, Math.min(rawSentences.length, Math.ceil(rawSentences.length * targetRatio)));
  const topSentences = [...sentenceScores].sort((a, b) => b.score - a.score).slice(0, countToKeep);
  topSentences.sort((a, b) => a.index - b.index);

  const summary = topSentences.map((s) => s.sentence).join(" ");
  const summaryWordsCount = summary.split(/\s+/).filter(Boolean).length;
  const reduction = Math.max(0, Math.round(((wordsCount - summaryWordsCount) / Math.max(1, wordsCount)) * 100));

  return {
    summary,
    originalWords: wordsCount,
    summaryWords: summaryWordsCount,
    reductionPercentage: reduction,
    keySentences: topSentences.map((s) => s.sentence),
    keywords,
  };
}

export function renderSimpleMarkdown(md: string): string {
  if (!md) return "";
  let html = md;

  // Escape HTML
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks ```code```
  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-xs font-mono my-3"><code>${code.trim()}</code></pre>`;
  });

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, "<code class=\"bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-pink-600 dark:text-pink-400\">$1</code>");

  // Headings
  html = html.replace(/^### (.*$)/gim, "<h3 class=\"text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2\">$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2 class=\"text-xl font-bold text-slate-900 dark:text-white mt-5 mb-2\">$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1 class=\"text-2xl font-extrabold text-slate-900 dark:text-white mt-6 mb-3\">$1</h1>");

  // Bold & Italic
  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong class=\"font-bold\">$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em class=\"italic\">$1</em>");
  html = html.replace(/~~([^~]+)~~/g, "<del class=\"line-through text-slate-400\">$1</del>");

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, "<blockquote class=\"border-l-4 border-blue-500 pl-4 py-1 my-2 text-slate-600 dark:text-slate-300 italic\">$1</blockquote>");

  // Horizontal rule
  html = html.replace(/^---$/gim, "<hr class=\"my-4 border-slate-200 dark:border-slate-800\" />");

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href=\"$2\" target=\"_blank\" rel=\"noopener\" class=\"text-blue-600 dark:text-blue-400 hover:underline\">$1</a>");

  // Unordered list items
  html = html.replace(/^\s*[-*]\s+(.*)$/gim, "<li class=\"ml-4 list-disc text-xs sm:text-sm\">$1</li>");

  // Paragraphs
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs
    .map((p) => {
      p = p.trim();
      if (!p) return "";
      if (
        p.startsWith("<h") ||
        p.startsWith("<pre") ||
        p.startsWith("<blockquote") ||
        p.startsWith("<hr") ||
        p.startsWith("<li")
      ) {
        return p;
      }
      return `<p class=\"my-2 leading-relaxed text-xs sm:text-sm\">${p.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}
