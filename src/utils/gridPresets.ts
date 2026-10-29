import { CustomGridSet, GridConfig } from '../types/crop';

const STORAGE_KEY = 'multicrop_custom_grid_sets_v1';

export const BUILT_IN_GRID_SETS: CustomGridSet[] = [
  {
    id: 'builtin_rpg_2x3',
    name: '2×3 RPG Items & Cards',
    description: '2 rows × 3 columns with clean 20px padding and 10px spacing',
    isBuiltIn: true,
    config: {
      rows: 2,
      cols: 3,
      autoCalculate: true,
      cellWidth: 120,
      cellHeight: 120,
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 20,
      marginRight: 20,
      gapX: 10,
      gapY: 10,
      sizingMode: 'rows-cols',
      order: 'row-major',
      startNumber: 1,
      centerGrid: true,
    },
  },
  {
    id: 'builtin_quad_2x2',
    name: '2×2 Quad Split',
    description: 'Even 4-quadrant layout with zero gaps for 4-way character cards',
    isBuiltIn: true,
    config: {
      rows: 2,
      cols: 2,
      autoCalculate: true,
      cellWidth: 100,
      cellHeight: 100,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      gapX: 0,
      gapY: 0,
      sizingMode: 'rows-cols',
      order: 'row-major',
      startNumber: 1,
    },
  },
  {
    id: 'builtin_matrix_3x3',
    name: '3×3 Icon Matrix',
    description: '9 equal cells with 8px gutters, ideal for sticker sheets and UI icons',
    isBuiltIn: true,
    config: {
      rows: 3,
      cols: 3,
      autoCalculate: true,
      cellWidth: 96,
      cellHeight: 96,
      marginTop: 10,
      marginBottom: 10,
      marginLeft: 10,
      marginRight: 10,
      gapX: 8,
      gapY: 8,
      sizingMode: 'rows-cols',
      order: 'row-major',
      startNumber: 1,
      centerGrid: true,
    },
  },
  {
    id: 'builtin_sprite_4x4',
    name: '4×4 Character Sprite Sheet',
    description: '16 uniform frames for walk cycles and animation sheets',
    isBuiltIn: true,
    config: {
      rows: 4,
      cols: 4,
      autoCalculate: true,
      cellWidth: 64,
      cellHeight: 64,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      gapX: 0,
      gapY: 0,
      sizingMode: 'rows-cols',
      order: 'row-major',
      startNumber: 1,
    },
  },
  {
    id: 'builtin_strip_1x4',
    name: '1×4 Horizontal Action Strip',
    description: 'Single row of 4 horizontal motion or attack frames',
    isBuiltIn: true,
    config: {
      rows: 1,
      cols: 4,
      autoCalculate: true,
      cellWidth: 80,
      cellHeight: 80,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      gapX: 0,
      gapY: 0,
      sizingMode: 'rows-cols',
      order: 'row-major',
      startNumber: 1,
    },
  },
  {
    id: 'builtin_strip_4x1',
    name: '4×1 Vertical Frames',
    description: 'Single column of 4 vertical animation frames',
    isBuiltIn: true,
    config: {
      rows: 4,
      cols: 1,
      autoCalculate: true,
      cellWidth: 80,
      cellHeight: 80,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      gapX: 0,
      gapY: 0,
      sizingMode: 'rows-cols',
      order: 'row-major',
      startNumber: 1,
    },
  },
  {
    id: 'builtin_sheet_4x6',
    name: '4×6 Sheet (24 Assets)',
    description: '24 slots for full inventory items or icon packages',
    isBuiltIn: true,
    config: {
      rows: 4,
      cols: 6,
      autoCalculate: true,
      cellWidth: 64,
      cellHeight: 64,
      marginTop: 8,
      marginBottom: 8,
      marginLeft: 8,
      marginRight: 8,
      gapX: 4,
      gapY: 4,
      sizingMode: 'rows-cols',
      order: 'row-major',
      startNumber: 1,
    },
  },
  {
    id: 'builtin_tile_16px',
    name: '16×16 px Pixel Art Tiles',
    description: 'Exact 16x16px fixed grid for retro pixel art tilesets',
    isBuiltIn: true,
    config: {
      rows: 1,
      cols: 1,
      autoCalculate: false,
      cellWidth: 16,
      cellHeight: 16,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      gapX: 0,
      gapY: 0,
      sizingMode: 'fixed-size',
      order: 'row-major',
      startNumber: 1,
    },
  },
  {
    id: 'builtin_tile_32px',
    name: '32×32 px Retro Tile Grid',
    description: 'Exact 32x32px tiles auto-filled across image dimensions',
    isBuiltIn: true,
    config: {
      rows: 1,
      cols: 1,
      autoCalculate: false,
      cellWidth: 32,
      cellHeight: 32,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      gapX: 0,
      gapY: 0,
      sizingMode: 'fixed-size',
      order: 'row-major',
      startNumber: 1,
    },
  },
  {
    id: 'builtin_tile_64px',
    name: '64×64 px Item Grid',
    description: 'Exact 64x64px HD sprites auto-fitted across the image',
    isBuiltIn: true,
    config: {
      rows: 1,
      cols: 1,
      autoCalculate: false,
      cellWidth: 64,
      cellHeight: 64,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      gapX: 0,
      gapY: 0,
      sizingMode: 'fixed-size',
      order: 'row-major',
      startNumber: 1,
    },
  },
];

/**
 * Load all grid sets combining built-ins and custom user-saved presets from localStorage
 */
export function getAllGridSets(): CustomGridSet[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [...BUILT_IN_GRID_SETS];
    }
    const userSets: CustomGridSet[] = JSON.parse(stored);
    return [...BUILT_IN_GRID_SETS, ...userSets];
  } catch (err) {
    console.error('Failed to parse saved grid sets from localStorage', err);
    return [...BUILT_IN_GRID_SETS];
  }
}

/**
 * Save a new user custom grid set
 */
export function saveUserCustomGridSet(
  name: string,
  config: GridConfig,
  description?: string
): CustomGridSet {
  const newSet: CustomGridSet = {
    id: `user_grid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim() || 'My Custom Grid Set',
    description: description?.trim() || `${config.rows}×${config.cols} custom grid`,
    isBuiltIn: false,
    config: { ...config },
    createdAt: Date.now(),
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const userSets: CustomGridSet[] = stored ? JSON.parse(stored) : [];
    userSets.unshift(newSet);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userSets));
  } catch (err) {
    console.error('Failed to save custom grid set to localStorage', err);
  }

  return newSet;
}

/**
 * Delete a user-saved custom grid set
 */
export function deleteUserCustomGridSet(id: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const userSets: CustomGridSet[] = JSON.parse(stored);
    const filtered = userSets.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete custom grid set from localStorage', err);
  }
}
