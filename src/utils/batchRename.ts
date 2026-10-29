import { CropRect } from '../types/crop';

export type BatchRenameMode = 'prefix-sequence' | 'sequence-only' | 'custom-template' | 'find-replace';

export type BatchRenameSortOrder = 'gallery' | 'spatial-row' | 'spatial-col' | 'name-asc';

export type CaseTransform = 'none' | 'lowercase' | 'uppercase' | 'snake' | 'kebab';

export interface BatchRenameConfig {
  mode: BatchRenameMode;
  prefix: string;
  separator: string;
  startIndex: number;
  step: number;
  padDigits: number; // 0 = no pad, 2 = '01', 3 = '001', 4 = '0001'
  suffix: string;
  findText: string;
  replaceText: string;
  caseSensitive: boolean;
  template: string; // e.g. '{prefix}_{index}' or '{name}_{w}x{h}'
  sortOrder: BatchRenameSortOrder;
  caseTransform: CaseTransform;
}

export const DEFAULT_BATCH_RENAME_CONFIG: BatchRenameConfig = {
  mode: 'prefix-sequence',
  prefix: 'sprite',
  separator: '_',
  startIndex: 1,
  step: 1,
  padDigits: 2,
  suffix: '',
  findText: '',
  replaceText: '',
  caseSensitive: false,
  template: '{prefix}_{index}',
  sortOrder: 'spatial-row',
  caseTransform: 'none',
};

/**
 * Format a number with optional zero-padding
 */
export function formatPaddedNumber(num: number, padDigits: number): string {
  const str = String(num);
  if (padDigits <= 1) return str;
  return str.padStart(padDigits, '0');
}

/**
 * Apply case transformations to a string
 */
export function applyCaseTransform(text: string, transform: CaseTransform): string {
  switch (transform) {
    case 'lowercase':
      return text.toLowerCase();
    case 'uppercase':
      return text.toUpperCase();
    case 'snake':
      return text
        .replace(/\s+/g, '_')
        .replace(/-+/g, '_')
        .toLowerCase();
    case 'kebab':
      return text
        .replace(/\s+/g, '-')
        .replace(/_+/g, '-')
        .toLowerCase();
    case 'none':
    default:
      return text;
  }
}

/**
 * Sort crops based on the selected ordering strategy
 */
export function sortCropsForBatchRename(crops: CropRect[], sortOrder: BatchRenameSortOrder): CropRect[] {
  const cloned = [...crops];

  switch (sortOrder) {
    case 'spatial-row':
      // Top-to-bottom, then left-to-right (with tolerance for slightly misaligned items)
      return cloned.sort((a, b) => {
        const yDiff = a.y - b.y;
        // If Y difference is small (within 5px), treat as same row and sort by X
        if (Math.abs(yDiff) < 5) {
          return a.x - b.x;
        }
        return yDiff;
      });

    case 'spatial-col':
      // Left-to-right, then top-to-bottom
      return cloned.sort((a, b) => {
        const xDiff = a.x - b.x;
        if (Math.abs(xDiff) < 5) {
          return a.y - b.y;
        }
        return xDiff;
      });

    case 'name-asc':
      return cloned.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );

    case 'gallery':
    default:
      return cloned;
  }
}

export interface BatchRenamePreviewItem {
  id: string;
  originalName: string;
  newName: string;
  hasConflict: boolean;
  crop: CropRect;
  sequenceIndex: number;
}

/**
 * Generate preview list of renamed crops with conflicts flagged
 */
export function generateBatchNames(
  crops: CropRect[],
  config: BatchRenameConfig
): BatchRenamePreviewItem[] {
  if (crops.length === 0) return [];

  // Sort crops according to sortOrder
  const sorted = sortCropsForBatchRename(crops, config.sortOrder);

  const rawResults: { id: string; originalName: string; newName: string; crop: CropRect; sequenceIndex: number }[] = [];

  sorted.forEach((crop, i) => {
    const seqNum = config.startIndex + i * config.step;
    const formattedNum = formatPaddedNumber(seqNum, config.padDigits);
    let generatedName = '';

    switch (config.mode) {
      case 'prefix-sequence': {
        const p = config.prefix.trim();
        const sep = config.separator;
        const s = config.suffix.trim();

        if (p) {
          generatedName = `${p}${sep}${formattedNum}${s ? `${sep}${s}` : ''}`;
        } else {
          generatedName = `${formattedNum}${s ? `${sep}${s}` : ''}`;
        }
        break;
      }

      case 'sequence-only': {
        const s = config.suffix.trim();
        generatedName = s ? `${formattedNum}${config.separator}${s}` : formattedNum;
        break;
      }

      case 'find-replace': {
        if (!config.findText) {
          generatedName = crop.name;
        } else {
          try {
            const flags = config.caseSensitive ? 'g' : 'gi';
            const escaped = config.findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, flags);
            generatedName = crop.name.replace(regex, config.replaceText);
          } catch {
            generatedName = crop.name;
          }
        }
        break;
      }

      case 'custom-template': {
        let t = config.template || '{prefix}_{index}';
        const p = config.prefix.trim();

        t = t
          .replace(/\{prefix\}/gi, p)
          .replace(/\{index\}/gi, formattedNum)
          .replace(/\{n\}/gi, formattedNum)
          .replace(/\{name\}/gi, crop.name)
          .replace(/\{original\}/gi, crop.name)
          .replace(/\{w\}/gi, String(Math.round(crop.width)))
          .replace(/\{h\}/gi, String(Math.round(crop.height)))
          .replace(/\{x\}/gi, String(Math.round(crop.x)))
          .replace(/\{y\}/gi, String(Math.round(crop.y)));

        if (config.suffix.trim()) {
          t = `${t}${config.separator}${config.suffix.trim()}`;
        }

        generatedName = t;
        break;
      }

      default:
        generatedName = crop.name;
    }

    // Apply case transformations
    generatedName = applyCaseTransform(generatedName, config.caseTransform);

    // Fallback if empty
    if (!generatedName.trim()) {
      generatedName = `asset_${formattedNum}`;
    }

    rawResults.push({
      id: crop.id,
      originalName: crop.name,
      newName: generatedName,
      crop,
      sequenceIndex: i + 1,
    });
  });

  // Detect duplicate new names
  const nameCounts = new Map<string, number>();
  rawResults.forEach((item) => {
    const key = item.newName.toLowerCase();
    nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
  });

  return rawResults.map((item) => ({
    ...item,
    hasConflict: (nameCounts.get(item.newName.toLowerCase()) || 0) > 1,
  }));
}
