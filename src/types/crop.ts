export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface CropRect {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  selected?: boolean;
}

export interface GridConfig {
  rows: number;
  cols: number;
  autoCalculate: boolean;
  cellWidth: number;
  cellHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  gapX: number;
  gapY: number;
  // Extended options for Custom Grid Set
  sizingMode?: 'rows-cols' | 'fixed-size';
  order?: 'row-major' | 'col-major';
  startNumber?: number;
  centerGrid?: boolean;
}

export type GridSizingMode = 'rows-cols' | 'fixed-size';
export type GridOrder = 'row-major' | 'col-major';

export interface CustomGridSet {
  id: string;
  name: string;
  description?: string;
  isBuiltIn?: boolean;
  config: GridConfig;
  namingPrefix?: string;
  startNumber?: number;
  createdAt?: number;
}

export interface BackgroundRemovalConfig {
  enabled: boolean;
  tolerance: number; // 0 to 100
  mode: 'edge-flood' | 'all-white';
}

export interface ImageInfo {
  name: string;
  width: number;
  height: number;
  size: number;
  type: string;
  url: string;
  element?: HTMLImageElement;
}

export type ActiveTool = 'select' | 'manual' | 'grid';

export type NamingFormat = 'number' | 'padded' | 'prefix';

export function formatDefaultCropName(
  index: number,
  format: NamingFormat = 'number',
  prefix = 'asset'
): string {
  if (format === 'number') {
    return String(index);
  }
  if (format === 'padded') {
    return String(index).padStart(3, '0');
  }
  return `${prefix}_${index}`;
}
