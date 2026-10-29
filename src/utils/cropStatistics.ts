import { CropRect, ImageInfo } from '../types/crop';

export interface CropStatistics {
  // Primary required metrics
  totalCrops: number;
  averageArea: number; // in px²
  coveragePercentage: number; // 0 to 100% (exact unique union coverage)
  
  // Detailed and supporting metrics
  totalCropArea: number; // in px² (sum of all crop areas)
  grossCoveragePercentage: number; // can exceed 100% if heavy overlaps
  imageArea: number; // in px²
  imageWidth: number;
  imageHeight: number;
  averageWidth: number;
  averageHeight: number;
  hasOverlap: boolean;
  overlapArea: number; // in px²
  overlapPercentage: number; // percentage of image overlapping

  // Min / Max extremes
  minAreaCrop: { crop: CropRect; area: number } | null;
  maxAreaCrop: { crop: CropRect; area: number } | null;

  // Aspect ratio classification
  aspectRatioCounts: {
    square: number; // 0.95 <= ratio <= 1.05
    landscape: number; // ratio > 1.05
    portrait: number; // ratio < 0.95
  };

  // Selection sub-metrics (if any crops selected)
  selectedCount: number;
  selectedTotalArea: number;
  selectedAverageArea: number;
  selectedCoveragePercentage: number;
}

/**
 * Computes exact 2D rectangle union area using sweep-line algorithm (Klee's measure problem in 2D).
 * Ensures crops extending outside image bounds are clipped to the image, and overlapping
 * regions are not counted more than once.
 */
export function calculateExactUnionArea(
  crops: CropRect[],
  imageWidth: number,
  imageHeight: number
): number {
  if (crops.length === 0 || imageWidth <= 0 || imageHeight <= 0) {
    return 0;
  }

  // 1. Clip crops to image bounds
  const clipped: { x1: number; x2: number; y1: number; y2: number }[] = [];
  for (const c of crops) {
    const x1 = Math.max(0, Math.min(imageWidth, c.x));
    const y1 = Math.max(0, Math.min(imageHeight, c.y));
    const x2 = Math.max(0, Math.min(imageWidth, c.x + c.width));
    const y2 = Math.max(0, Math.min(imageHeight, c.y + c.height));
    if (x2 > x1 && y2 > y1) {
      clipped.push({ x1, x2, y1, y2 });
    }
  }

  if (clipped.length === 0) return 0;

  // 2. Collect unique X coordinates
  const xCoordsSet = new Set<number>();
  for (const r of clipped) {
    xCoordsSet.add(r.x1);
    xCoordsSet.add(r.x2);
  }
  const xCoords = Array.from(xCoordsSet).sort((a, b) => a - b);

  let totalUnionArea = 0;

  // 3. Sweep along X intervals
  for (let i = 0; i < xCoords.length - 1; i++) {
    const xLeft = xCoords[i];
    const xRight = xCoords[i + 1];
    const dx = xRight - xLeft;
    if (dx <= 0) continue;

    // Find all rectangles covering this X-strip [xLeft, xRight]
    const yIntervals: [number, number][] = [];
    for (const r of clipped) {
      if (r.x1 <= xLeft && r.x2 >= xRight) {
        yIntervals.push([r.y1, r.y2]);
      }
    }

    if (yIntervals.length === 0) continue;

    // Merge 1D intervals along Y
    yIntervals.sort((a, b) => a[0] - b[0]);
    let mergedYLength = 0;
    let [curY1, curY2] = yIntervals[0];

    for (let j = 1; j < yIntervals.length; j++) {
      const [nextY1, nextY2] = yIntervals[j];
      if (nextY1 <= curY2) {
        curY2 = Math.max(curY2, nextY2);
      } else {
        mergedYLength += (curY2 - curY1);
        curY1 = nextY1;
        curY2 = nextY2;
      }
    }
    mergedYLength += (curY2 - curY1);

    totalUnionArea += dx * mergedYLength;
  }

  return totalUnionArea;
}

/**
 * Calculates complete crop statistics for a given list of crops and image information.
 */
export function calculateCropStatistics(
  crops: CropRect[],
  imageInfo: ImageInfo | null,
  selectedCropIds?: Set<string>
): CropStatistics {
  const totalCrops = crops.length;
  const imageWidth = imageInfo?.width || 0;
  const imageHeight = imageInfo?.height || 0;
  const imageArea = imageWidth * imageHeight;

  if (totalCrops === 0 || !imageInfo || imageArea <= 0) {
    return {
      totalCrops: 0,
      averageArea: 0,
      coveragePercentage: 0,
      totalCropArea: 0,
      grossCoveragePercentage: 0,
      imageArea: Math.max(0, imageArea),
      imageWidth,
      imageHeight,
      averageWidth: 0,
      averageHeight: 0,
      hasOverlap: false,
      overlapArea: 0,
      overlapPercentage: 0,
      minAreaCrop: null,
      maxAreaCrop: null,
      aspectRatioCounts: { square: 0, landscape: 0, portrait: 0 },
      selectedCount: 0,
      selectedTotalArea: 0,
      selectedAverageArea: 0,
      selectedCoveragePercentage: 0,
    };
  }

  let totalCropArea = 0;
  let totalW = 0;
  let totalH = 0;

  let minCrop: { crop: CropRect; area: number } | null = null;
  let maxCrop: { crop: CropRect; area: number } | null = null;

  const aspectCounts = {
    square: 0,
    landscape: 0,
    portrait: 0,
  };

  for (const crop of crops) {
    const area = crop.width * crop.height;
    totalCropArea += area;
    totalW += crop.width;
    totalH += crop.height;

    if (!minCrop || area < minCrop.area) {
      minCrop = { crop, area };
    }
    if (!maxCrop || area > maxCrop.area) {
      maxCrop = { crop, area };
    }

    const ratio = crop.height > 0 ? crop.width / crop.height : 1;
    if (ratio >= 0.95 && ratio <= 1.05) {
      aspectCounts.square++;
    } else if (ratio > 1.05) {
      aspectCounts.landscape++;
    } else {
      aspectCounts.portrait++;
    }
  }

  const averageArea = totalCropArea / totalCrops;
  const averageWidth = totalW / totalCrops;
  const averageHeight = totalH / totalCrops;

  // Exact union area (non-double-counted coverage)
  const uniqueUnionArea = calculateExactUnionArea(crops, imageWidth, imageHeight);
  const coveragePercentage = (uniqueUnionArea / imageArea) * 100;
  const grossCoveragePercentage = (totalCropArea / imageArea) * 100;

  const overlapArea = Math.max(0, totalCropArea - uniqueUnionArea);
  const hasOverlap = overlapArea > 1; // 1px threshold for floating point tolerance
  const overlapPercentage = (overlapArea / imageArea) * 100;

  // Selection statistics
  let selectedCount = 0;
  let selectedTotalArea = 0;
  const selectedCrops: CropRect[] = [];

  if (selectedCropIds && selectedCropIds.size > 0) {
    for (const crop of crops) {
      if (selectedCropIds.has(crop.id)) {
        selectedCount++;
        selectedTotalArea += crop.width * crop.height;
        selectedCrops.push(crop);
      }
    }
  }

  const selectedAverageArea = selectedCount > 0 ? selectedTotalArea / selectedCount : 0;
  const selectedUnionArea = selectedCount > 0 ? calculateExactUnionArea(selectedCrops, imageWidth, imageHeight) : 0;
  const selectedCoveragePercentage = imageArea > 0 ? (selectedUnionArea / imageArea) * 100 : 0;

  return {
    totalCrops,
    averageArea: Math.round(averageArea * 10) / 10,
    coveragePercentage: Math.round(coveragePercentage * 10) / 10,
    totalCropArea: Math.round(totalCropArea),
    grossCoveragePercentage: Math.round(grossCoveragePercentage * 10) / 10,
    imageArea,
    imageWidth,
    imageHeight,
    averageWidth: Math.round(averageWidth * 10) / 10,
    averageHeight: Math.round(averageHeight * 10) / 10,
    hasOverlap,
    overlapArea: Math.round(overlapArea),
    overlapPercentage: Math.round(overlapPercentage * 10) / 10,
    minAreaCrop: minCrop,
    maxAreaCrop: maxCrop,
    aspectRatioCounts: aspectCounts,
    selectedCount,
    selectedTotalArea: Math.round(selectedTotalArea),
    selectedAverageArea: Math.round(selectedAverageArea * 10) / 10,
    selectedCoveragePercentage: Math.round(selectedCoveragePercentage * 10) / 10,
  };
}

/**
 * Format numbers with comma grouping, e.g. 120,400 px²
 */
export function formatArea(num: number): string {
  return Math.round(num).toLocaleString('en-US');
}
