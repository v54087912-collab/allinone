import { CropRect, GridConfig, NamingFormat, formatDefaultCropName } from '../types/crop';

/**
 * Calculates grid crop rectangles based on grid configuration and image boundaries.
 * Supports auto-fit, fixed cell size (px), row-major and column-major order, and custom start numbering.
 */
export function calculateGridCrops(
  config: GridConfig,
  imgW: number,
  imgH: number,
  existingCount = 0,
  namingFormat: NamingFormat = 'number',
  prefix = 'asset'
): CropRect[] {
  if (imgW <= 0 || imgH <= 0) {
    return [];
  }

  const {
    autoCalculate,
    marginTop = 0,
    marginBottom = 0,
    marginLeft = 0,
    marginRight = 0,
    gapX = 0,
    gapY = 0,
    sizingMode = 'rows-cols',
    order = 'row-major',
    centerGrid = false,
  } = config;

  let rows = config.rows;
  let cols = config.cols;
  let cellW = config.cellWidth || 32;
  let cellH = config.cellHeight || 32;

  const usableW = Math.max(0, imgW - marginLeft - marginRight);
  const usableH = Math.max(0, imgH - marginTop - marginBottom);

  if (usableW <= 0 || usableH <= 0) {
    return [];
  }

  if (sizingMode === 'fixed-size') {
    // Determine how many columns and rows can fit into the image
    cols = Math.max(1, Math.floor((usableW + gapX) / (cellW + gapX)));
    rows = Math.max(1, Math.floor((usableH + gapY) / (cellH + gapY)));
  } else {
    // Rows & Cols mode
    rows = Math.max(1, rows);
    cols = Math.max(1, cols);

    if (autoCalculate) {
      const availableWidth = usableW - (cols - 1) * gapX;
      const availableHeight = usableH - (rows - 1) * gapY;
      cellW = Math.max(4, Math.floor(availableWidth / cols));
      cellH = Math.max(4, Math.floor(availableHeight / rows));
    }
  }

  if (cellW <= 0 || cellH <= 0 || rows <= 0 || cols <= 0) {
    return [];
  }

  // Calculate actual grid bounds for centering if enabled
  const totalGridW = cols * cellW + (cols - 1) * gapX;
  const totalGridH = rows * cellH + (rows - 1) * gapY;

  let originX = marginLeft;
  let originY = marginTop;

  if (centerGrid && totalGridW < usableW) {
    originX = marginLeft + Math.floor((usableW - totalGridW) / 2);
  }
  if (centerGrid && totalGridH < usableH) {
    originY = marginTop + Math.floor((usableH - totalGridH) / 2);
  }

  const crops: CropRect[] = [];
  const startNum = config.startNumber !== undefined && config.startNumber > 0
    ? config.startNumber
    : existingCount + 1;
  let index = startNum;

  if (order === 'col-major') {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = Math.round(originX + c * (cellW + gapX));
        const y = Math.round(originY + r * (cellH + gapY));

        if (x >= imgW || y >= imgH) continue;

        const clampedW = Math.min(cellW, imgW - x);
        const clampedH = Math.min(cellH, imgH - y);

        if (clampedW < 4 || clampedH < 4) continue;

        crops.push({
          id: `crop_${Date.now()}_${r}_${c}_${Math.random().toString(36).substring(2, 7)}`,
          name: formatDefaultCropName(index, namingFormat, prefix),
          x,
          y,
          width: clampedW,
          height: clampedH,
          selected: false,
        });

        index++;
      }
    }
  } else {
    // row-major: left to right, top to bottom
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = Math.round(originX + c * (cellW + gapX));
        const y = Math.round(originY + r * (cellH + gapY));

        if (x >= imgW || y >= imgH) continue;

        const clampedW = Math.min(cellW, imgW - x);
        const clampedH = Math.min(cellH, imgH - y);

        if (clampedW < 4 || clampedH < 4) continue;

        crops.push({
          id: `crop_${Date.now()}_${r}_${c}_${Math.random().toString(36).substring(2, 7)}`,
          name: formatDefaultCropName(index, namingFormat, prefix),
          x,
          y,
          width: clampedW,
          height: clampedH,
          selected: false,
        });

        index++;
      }
    }
  }

  return crops;
}
