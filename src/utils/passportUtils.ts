/**
 * Passport and Visa Photo standards and sheet calculations
 */

export interface PassportStandard {
  id: string;
  country: string;
  name: string;
  widthMm: number;
  heightMm: number;
  description: string;
  headMinPercent: number; // e.g. 50%
  headMaxPercent: number; // e.g. 69%
}

export const PASSPORT_STANDARDS: Record<string, PassportStandard> = {
  us: {
    id: 'us',
    country: 'United States',
    name: 'US Passport / Visa (2×2 in / 51×51 mm)',
    widthMm: 50.8,
    heightMm: 50.8,
    description: 'Official 2x2 inch standard for US Passports, Green Cards & Visas',
    headMinPercent: 50,
    headMaxPercent: 69,
  },
  uk_eu: {
    id: 'uk_eu',
    country: 'UK & European Union',
    name: 'UK / EU / Schengen (35×45 mm)',
    widthMm: 35,
    heightMm: 45,
    description: 'Standard biometric photo for UK, Germany, France, Italy, Spain & Schengen Area',
    headMinPercent: 70,
    headMaxPercent: 80,
  },
  in: {
    id: 'in',
    country: 'India',
    name: 'India Passport & OCI (35×45 mm)',
    widthMm: 35,
    heightMm: 45,
    description: 'Indian passport, visa application and OCI registration photos',
    headMinPercent: 60,
    headMaxPercent: 75,
  },
  cn: {
    id: 'cn',
    country: 'China',
    name: 'China Passport & Visa (33×48 mm)',
    widthMm: 33,
    heightMm: 48,
    description: 'National Chinese passport and consular travel visa standards',
    headMinPercent: 60,
    headMaxPercent: 70,
  },
  ca: {
    id: 'ca',
    country: 'Canada',
    name: 'Canada Passport (50×70 mm)',
    widthMm: 50,
    heightMm: 70,
    description: 'Canadian passport and permanent resident document specifications',
    headMinPercent: 50,
    headMaxPercent: 65,
  },
  au: {
    id: 'au',
    country: 'Australia',
    name: 'Australia Passport (35×45 mm)',
    widthMm: 35,
    heightMm: 45,
    description: 'Australian passport and international travel document standard',
    headMinPercent: 71,
    headMaxPercent: 79,
  },
};

export function mmToPixels(mm: number, dpi: number = 300): number {
  return Math.round((mm / 25.4) * dpi);
}

export interface PrintSheetLayout {
  sheetWidthPx: number;
  sheetHeightPx: number;
  cols: number;
  rows: number;
  totalPhotos: number;
  gapPx: number;
  positions: Array<{ x: number; y: number }>;
}

export function calculatePrintSheetLayout(
  photoWidthPx: number,
  photoHeightPx: number,
  sheetType: '4x6' | 'a4',
  dpi: number = 300,
  marginMm: number = 5,
  gapMm: number = 3
): PrintSheetLayout {
  // 4x6 inch = 101.6 x 152.4 mm (typically printed landscape 1800x1200 or portrait 1200x1800 @ 300 DPI)
  // A4 = 210 x 297 mm
  const is4x6 = sheetType === '4x6';
  const sheetWidthMm = is4x6 ? 152.4 : 210;
  const sheetHeightMm = is4x6 ? 101.6 : 297;

  const sheetWidthPx = mmToPixels(sheetWidthMm, dpi);
  const sheetHeightPx = mmToPixels(sheetHeightMm, dpi);
  const marginPx = mmToPixels(marginMm, dpi);
  const gapPx = mmToPixels(gapMm, dpi);

  const availableWidth = sheetWidthPx - 2 * marginPx;
  const availableHeight = sheetHeightPx - 2 * marginPx;

  const cols = Math.max(1, Math.floor((availableWidth + gapPx) / (photoWidthPx + gapPx)));
  const rows = Math.max(1, Math.floor((availableHeight + gapPx) / (photoHeightPx + gapPx)));
  const totalPhotos = cols * rows;

  // Center photos on sheet
  const usedWidth = cols * photoWidthPx + (cols - 1) * gapPx;
  const usedHeight = rows * photoHeightPx + (rows - 1) * gapPx;
  const startX = Math.round((sheetWidthPx - usedWidth) / 2);
  const startY = Math.round((sheetHeightPx - usedHeight) / 2);

  const positions: Array<{ x: number; y: number }> = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push({
        x: startX + c * (photoWidthPx + gapPx),
        y: startY + r * (photoHeightPx + gapPx),
      });
    }
  }

  return {
    sheetWidthPx,
    sheetHeightPx,
    cols,
    rows,
    totalPhotos,
    gapPx,
    positions,
  };
}
