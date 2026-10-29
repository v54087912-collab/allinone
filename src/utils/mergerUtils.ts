/**
 * Image Merger / Stitcher calculation utilities
 */

export type MergeDirection = 'vertical' | 'horizontal' | 'grid';
export type MergeAlignment = 'start' | 'center' | 'end';

export interface ImageDimension {
  id: string;
  width: number;
  height: number;
}

export interface MergeOptions {
  direction: MergeDirection;
  spacing: number;
  gridColumns?: number;
  alignment?: MergeAlignment;
  matchDimensions?: boolean; // match widths in vertical, match heights in horizontal
  backgroundColor?: string;
}

export interface MergedLayout {
  totalWidth: number;
  totalHeight: number;
  positions: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export function calculateMergedLayout(
  images: ImageDimension[],
  options: MergeOptions
): MergedLayout {
  if (images.length === 0) {
    return { totalWidth: 0, totalHeight: 0, positions: [] };
  }

  const { direction, spacing, alignment = 'center', matchDimensions = true } = options;

  if (direction === 'vertical') {
    // Match width to the maximum width if requested
    const targetWidth = matchDimensions
      ? Math.max(...images.map((img) => img.width))
      : 0;

    let currentY = 0;
    const positions: MergedLayout['positions'] = [];
    let maxWidth = 0;

    images.forEach((img, idx) => {
      let renderW = img.width;
      let renderH = img.height;

      if (matchDimensions && targetWidth > 0 && img.width > 0) {
        const ratio = targetWidth / img.width;
        renderW = targetWidth;
        renderH = Math.round(img.height * ratio);
      }

      maxWidth = Math.max(maxWidth, renderW);
      positions.push({
        id: img.id,
        x: 0, // will adjust for alignment below
        y: currentY,
        width: renderW,
        height: renderH,
      });

      currentY += renderH;
      if (idx < images.length - 1) {
        currentY += spacing;
      }
    });

    // Adjust X position based on alignment
    positions.forEach((pos) => {
      if (alignment === 'center') {
        pos.x = Math.round((maxWidth - pos.width) / 2);
      } else if (alignment === 'end') {
        pos.x = maxWidth - pos.width;
      } else {
        pos.x = 0;
      }
    });

    return {
      totalWidth: maxWidth,
      totalHeight: currentY,
      positions,
    };
  }

  if (direction === 'horizontal') {
    // Match height to the maximum height if requested
    const targetHeight = matchDimensions
      ? Math.max(...images.map((img) => img.height))
      : 0;

    let currentX = 0;
    const positions: MergedLayout['positions'] = [];
    let maxHeight = 0;

    images.forEach((img, idx) => {
      let renderW = img.width;
      let renderH = img.height;

      if (matchDimensions && targetHeight > 0 && img.height > 0) {
        const ratio = targetHeight / img.height;
        renderH = targetHeight;
        renderW = Math.round(img.width * ratio);
      }

      maxHeight = Math.max(maxHeight, renderH);
      positions.push({
        id: img.id,
        x: currentX,
        y: 0, // will adjust for alignment below
        width: renderW,
        height: renderH,
      });

      currentX += renderW;
      if (idx < images.length - 1) {
        currentX += spacing;
      }
    });

    // Adjust Y position based on alignment
    positions.forEach((pos) => {
      if (alignment === 'center') {
        pos.y = Math.round((maxHeight - pos.height) / 2);
      } else if (alignment === 'end') {
        pos.y = maxHeight - pos.height;
      } else {
        pos.y = 0;
      }
    });

    return {
      totalWidth: currentX,
      totalHeight: maxHeight,
      positions,
    };
  }

  // Grid direction
  const cols = Math.max(1, options.gridColumns || Math.ceil(Math.sqrt(images.length)));
  const rows = Math.ceil(images.length / cols);

  // Standardize cell size
  const maxW = Math.max(...images.map((img) => img.width));
  const maxH = Math.max(...images.map((img) => img.height));

  const totalWidth = cols * maxW + (cols - 1) * spacing;
  const totalHeight = rows * maxH + (rows - 1) * spacing;
  const positions: MergedLayout['positions'] = [];

  images.forEach((img, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);

    const cellX = col * (maxW + spacing);
    const cellY = row * (maxH + spacing);

    let renderW = img.width;
    let renderH = img.height;

    // Scale down proportionally if larger than cell
    if (renderW > maxW || renderH > maxH) {
      const scale = Math.min(maxW / renderW, maxH / renderH);
      renderW = Math.round(renderW * scale);
      renderH = Math.round(renderH * scale);
    }

    const offsetX = Math.round((maxW - renderW) / 2);
    const offsetY = Math.round((maxH - renderH) / 2);

    positions.push({
      id: img.id,
      x: cellX + offsetX,
      y: cellY + offsetY,
      width: renderW,
      height: renderH,
    });
  });

  return {
    totalWidth,
    totalHeight,
    positions,
  };
}
