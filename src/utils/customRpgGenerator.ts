/**
 * Client-side 100% Canvas RPG Sprite Sheet Generator.
 * Generates custom 2x3 (or configurable) item sprite sheets with pure Canvas API.
 */

export type RpgItemType =
  | 'knight'
  | 'potion_health'
  | 'potion_mana'
  | 'coin'
  | 'shield'
  | 'egg'
  | 'key'
  | 'sword'
  | 'book'
  | 'gem'
  | 'crown'
  | 'chest'
  | 'bow'
  | 'skull';

export interface RpgItemSlot {
  id: string;
  type: RpgItemType;
  label: string;
  color: string;
}

export interface RpgSheetConfig {
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
  gap: number;
  margin: number;
  backgroundColor: string; // '#ffffff', '#0f172a', 'transparent', etc.
  showBorders: boolean;
  showLabels: boolean;
  items: RpgItemSlot[];
}

export const RPG_AVAILABLE_ITEMS: { type: RpgItemType; name: string; defaultColor: string }[] = [
  { type: 'knight', name: 'Hero Knight Helmet', defaultColor: '#6366f1' },
  { type: 'potion_health', name: 'Health Potion', defaultColor: '#ef4444' },
  { type: 'potion_mana', name: 'Mana Potion', defaultColor: '#3b82f6' },
  { type: 'coin', name: 'Gold Coin', defaultColor: '#facc15' },
  { type: 'shield', name: 'Knight Shield', defaultColor: '#10b981' },
  { type: 'egg', name: 'Dragon Egg', defaultColor: '#f97316' },
  { type: 'key', name: 'Dungeon Key', defaultColor: '#06b6d4' },
  { type: 'sword', name: 'Iron Broadsword', defaultColor: '#8b5cf6' },
  { type: 'book', name: 'Magic Spellbook', defaultColor: '#ec4899' },
  { type: 'gem', name: 'Mystic Ruby Gem', defaultColor: '#dc2626' },
  { type: 'crown', name: 'Royal Crown', defaultColor: '#eab308' },
  { type: 'chest', name: 'Treasure Chest', defaultColor: '#78350f' },
  { type: 'bow', name: 'Hunting Bow', defaultColor: '#14b8a6' },
  { type: 'skull', name: 'Cursed Skull', defaultColor: '#94a3b8' },
];

export function getDefault2x3RpgItems(): RpgItemSlot[] {
  return [
    { id: '1', type: 'knight', label: 'Hero Knight', color: '#6366f1' },
    { id: '2', type: 'potion_health', label: 'Magic Potion', color: '#ec4899' },
    { id: '3', type: 'coin', label: 'Gold Coin', color: '#facc15' },
    { id: '4', type: 'shield', label: 'Wooden Shield', color: '#10b981' },
    { id: '5', type: 'egg', label: 'Dragon Egg', color: '#f97316' },
    { id: '6', type: 'key', label: 'Ancient Key', color: '#06b6d4' },
  ];
}

/**
 * Draws an RPG item inside a cell centered at (0, 0)
 */
export function drawRpgItemSprite(
  ctx: CanvasRenderingContext2D,
  type: RpgItemType,
  color: string
): void {
  ctx.save();

  if (type === 'knight') {
    // Helmet base
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -14, 26, 0, Math.PI * 2);
    ctx.fill();
    // Crest plume
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(0, -38, 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // Visor
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-14, -18, 28, 9);
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-12, -16, 24, 5);
    // Neck Armor
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-22, 10);
    ctx.lineTo(22, 10);
    ctx.lineTo(16, 36);
    ctx.lineTo(-16, 36);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#312e81';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (type === 'potion_health' || type === 'potion_mana') {
    // Cork & Neck
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-6, -34, 12, 8);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-8, -26, 16, 10);
    // Round Glass Flask
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 8, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Highlight reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(-8, 0, 9, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'coin') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 5;
    ctx.stroke();
    // Inner bevel
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
    // Center icon
    ctx.fillStyle = '#854d0e';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 2);
  } else if (type === 'shield') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(28, -22);
    ctx.lineTo(22, 16);
    ctx.lineTo(0, 38);
    ctx.lineTo(-22, 16);
    ctx.lineTo(-28, -22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#065f46';
    ctx.lineWidth = 4;
    ctx.stroke();
    // White Cross Emblem
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, -16, 10, 32);
    ctx.fillRect(-16, -5, 32, 10);
  } else if (type === 'egg') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 2, 24, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    // Magma spots
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(-8, -10, 6, 0, Math.PI * 2);
    ctx.arc(10, 8, 8, 0, Math.PI * 2);
    ctx.arc(-4, 18, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'key') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -20, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -20, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(-4, -5, 8, 42);
    ctx.fillRect(4, 12, 12, 7);
    ctx.fillRect(4, 24, 9, 7);
  } else if (type === 'sword') {
    ctx.rotate(Math.PI / 4);
    // Blade
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(-6, -34);
    ctx.lineTo(0, -42);
    ctx.lineTo(6, -34);
    ctx.lineTo(6, 14);
    ctx.lineTo(-6, 14);
    ctx.closePath();
    ctx.fill();
    // Fuller
    ctx.fillStyle = color;
    ctx.fillRect(-1.5, -34, 3, 44);
    // Guard
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-18, 14, 36, 7);
    // Grip
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-4, 21, 8, 16);
    // Pommel
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(0, 40, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'book') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-26, -30, 52, 60, 6);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(20, -26, 4, 52);
    // Cover border
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 3;
    ctx.strokeRect(-22, -26, 40, 52);
    // Magic Star
    ctx.fillStyle = '#fef08a';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', -2, 0);
  } else if (type === 'gem') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-24, -12);
    ctx.lineTo(-12, -32);
    ctx.lineTo(12, -32);
    ctx.lineTo(24, -12);
    ctx.lineTo(0, 34);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facet lines
    ctx.beginPath();
    ctx.moveTo(-12, -32);
    ctx.lineTo(0, 34);
    ctx.lineTo(12, -32);
    ctx.moveTo(-24, -12);
    ctx.lineTo(24, -12);
    ctx.stroke();
  } else if (type === 'crown') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-26, 18);
    ctx.lineTo(-28, -20);
    ctx.lineTo(-14, -6);
    ctx.lineTo(0, -28);
    ctx.lineTo(14, -6);
    ctx.lineTo(28, -20);
    ctx.lineTo(26, 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Jewels
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(-14, 2, 4, 0, Math.PI * 2);
    ctx.arc(14, 2, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'chest') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-26, -14, 52, 38, 4);
    ctx.fill();
    // Lid
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.ellipse(0, -14, 26, 16, 0, Math.PI, 0);
    ctx.fill();
    // Iron banding
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.strokeRect(-26, -14, 52, 38);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-5, -6, 10, 12);
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'bow') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 32, -Math.PI / 2.2, Math.PI / 2.2);
    ctx.stroke();
    // String
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(10, -30);
    ctx.lineTo(10, 30);
    ctx.stroke();
    // Arrow
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(24, 0);
    ctx.stroke();
  } else if (type === 'skull') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -8, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-12, 10, 24, 16);
    // Eye sockets
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-8, -6, 6, 0, Math.PI * 2);
    ctx.arc(8, -6, 6, 0, Math.PI * 2);
    ctx.fill();
    // Nose & teeth
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(-3, 8);
    ctx.lineTo(3, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-8, 18, 3, 8);
    ctx.fillRect(-2, 18, 4, 8);
    ctx.fillRect(5, 18, 3, 8);
  }

  ctx.restore();
}

/**
 * Renders the full RPG Sprite sheet onto a Canvas element.
 */
export function renderCustomRpgSheet(config: RpgSheetConfig): HTMLCanvasElement {
  const {
    rows,
    cols,
    cellWidth,
    cellHeight,
    gap,
    margin,
    backgroundColor,
    showBorders,
    showLabels,
    items,
  } = config;

  const totalWidth = margin * 2 + cols * cellWidth + (cols - 1) * gap;
  const totalHeight = margin * 2 + rows * cellHeight + (rows - 1) * gap;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(10, totalWidth);
  canvas.height = Math.max(10, totalHeight);

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background
  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, totalWidth, totalHeight);
  } else {
    ctx.clearRect(0, 0, totalWidth, totalHeight);
  }

  // Draw cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const x = margin + c * (cellWidth + gap);
      const y = margin + r * (cellHeight + gap);

      // Cell border
      if (showBorders) {
        ctx.strokeStyle = backgroundColor === '#ffffff' ? '#e2e8f0' : '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellWidth, cellHeight);
      }

      const item = items[idx] || items[idx % items.length];
      if (item) {
        const cx = x + cellWidth / 2;
        const cy = y + cellHeight / 2 - (showLabels ? 10 : 0);

        ctx.save();
        ctx.translate(cx, cy);
        drawRpgItemSprite(ctx, item.type, item.color);
        ctx.restore();

        // Label
        if (showLabels && item.label) {
          ctx.fillStyle = backgroundColor === '#ffffff' ? '#64748b' : '#94a3b8';
          ctx.font = '600 13px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(item.label, x + cellWidth / 2, y + cellHeight - 14);
        }
      }
    }
  }

  return canvas;
}
